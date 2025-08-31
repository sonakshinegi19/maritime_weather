import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap, useMapEvents, Circle, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography } from '@mui/material';
// MaritimePolyline removed - pathfinding now handled in route calculation
import { Position as GeoPosition } from '../../services/geocoding';
import WindLayer from './WindLayer';
import WeatherControlPanel from './WeatherControlPanel';
import { ExtremeWeatherCondition, AlternativeRoute } from '../../types/weather';

interface WindData {
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  location?: string;
}

// Fix for default marker icons in React Leaflet
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace L {
    interface Map {
      _getTopLeftPoint?(): L.Point;
    }
  }
}

// Create custom icons
const createPortIcon = () => {
  return L.divIcon({
    html: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
        <circle cx="12" cy="12" r="6" fill="#8BC34A"/>
        <circle cx="12" cy="12" r="2" fill="#FFEB3B"/>
      </svg>
    `,
    className: 'port-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const createShipIcon = () => {
  return L.divIcon({
    html: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13H5V17H3V13Z" fill="#1E88E5"/>
        <path d="M5 11H7V13H5V11Z" fill="#0D47A1"/>
        <path d="M7 9H9V11H7V9Z" fill="#0D47A1"/>
        <path d="M9 7H11V9H7V11H5V13H3V15H1V17H3V15H5V17H7V15H9V17H11V15H13V17H15V15H17V17H19V15H21V17H23V15H21V13H19V11H17V9H15V7H13V5H11V3H9V1H7V3H5V5H3V7H1V9H3V7H5V9H7V7H9V9H11V7H9Z" fill="#1976D2"/>
        <path d="M11 13H13V15H11V13Z" fill="#0D47A1"/>
        <path d="M13 11H15V13H13V11Z" fill="#0D47A1"/>
        <path d="M15 9H17V11H15V9Z" fill="#0D47A1"/>
        <path d="M17 11H19V13H17V11Z" fill="#0D47A1"/>
        <path d="M17 7H19V9H17V7Z" fill="#0D47A1"/>
      </svg>
    `,
    className: 'ship-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Maritime tile layer (water-focused)
const MaritimeTileLayer: React.FC = () => {
  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
  );
};

// Helper function to create a LatLngBounds from positions
const createBounds = (positions: RoutePosition[]): L.LatLngBounds => {
  if (!positions || positions.length === 0) {
    // Return default bounds if no positions
    return L.latLngBounds([[0, 0], [1, 1]]);
  }

  try {
    const bounds = L.latLngBounds(
      positions.map(pos => [pos.lat, pos.lng] as [number, number])
    );
    return bounds;
  } catch (error) {
    console.warn('Error creating bounds:', error);
    // Return default bounds on error
    return L.latLngBounds([[0, 0], [1, 1]]);
  }
};

// Extended position type that includes route type information
export interface RoutePosition {
  lat: number;
  lng: number;
  name: string;
  type: 'departure' | 'destination' | 'waypoint' | 'course_change';
  timestamp?: string;
  speed?: number;
  heading?: number;
  status?: string;
  [key: string]: any; // Allow additional properties
}

// Old curved path generation removed - now handled by Turf.js pathfinding

// All old maritime routing code removed - now handled by Turf.js pathfinding in route calculation

interface Port {
  name: string;
  lat: number;
  lng: number;
  country: string;
  type?: 'departure' | 'destination' | 'waypoint';
}

interface MapContentProps {
  route: RoutePosition[];
  selectedRoute?: RoutePosition[] | null;
  alternativeRoutes?: AlternativeRoute[];
  windData: WindData[];
  showWindLayer: boolean;
  extremeWeather: ExtremeWeatherCondition[];
  onMapClick: (latlng: L.LatLng) => void;
  onMarkerClick: (marker: any) => void;
  selectedMarker: any;
  showControls: boolean;
  enablePortSelection: boolean;
  onPortSelect: (port: Port) => void;
}

const MapContent: React.FC<MapContentProps> = ({
  route,
  selectedRoute,
  alternativeRoutes = [],
  windData,
  showWindLayer,
  extremeWeather,
  onMapClick,
  onMarkerClick,
  selectedMarker,
  showControls,
  enablePortSelection,
  onPortSelect,
}) => {
  const map = useMap();
  const polylineRef = useRef<L.Polyline | null>(null);

  // Handle map click
  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    console.log('Map click detected:', e.latlng, 'enablePortSelection:', enablePortSelection, 'onPortSelect:', !!onPortSelect);

    if (enablePortSelection && onPortSelect) {
      // Import findNearestPort dynamically to avoid circular dependencies
      const { findNearestPort } = await import('../../services/portDatabase');

      // Find the nearest port to the clicked location
      const nearestPort = findNearestPort(e.latlng.lat, e.latlng.lng, 100);

      // Create a port object - use nearest port if found, otherwise use clicked location
      const newPort: Port = nearestPort ? {
        name: nearestPort.name,
        lat: nearestPort.lat,
        lng: nearestPort.lng,
        country: nearestPort.country,
        type: 'waypoint'
      } : {
        name: `Port at ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        country: 'Unknown',
        type: 'waypoint'
      };

      console.log('Calling onPortSelect with:', newPort);
      onPortSelect(newPort);
    }
    onMapClick?.(e.latlng);
  }, [onMapClick, onPortSelect, enablePortSelection]);

  // Set up map click handler
  useEffect(() => {
    if (typeof onMapClick === 'function') {
      map.on('click', handleMapClick);
      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [map, handleMapClick, onMapClick, enablePortSelection]);

  // Fit map to route bounds when route changes
  useEffect(() => {
    if (route.length > 0) {
      try {
        const bounds = createBounds(route);
        // Add a small delay to ensure map is ready
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }, 100);
      } catch (error) {
        console.warn('Error fitting map bounds:', error);
      }
    }
  }, [route, map]);

  // Render weather conditions
  const renderWeatherConditions = () => {
    return extremeWeather.map((weather) => {
      // Define colors based on weather type and intensity
      const getWeatherStyle = (weather: ExtremeWeatherCondition) => {
        const baseOpacity = 0.3;
        const intensityFactor = weather.intensity / 10;
        
        switch (weather.type) {
          case 'tsunami':
            return {
              color: '#e91e63',
              fillColor: '#e91e63',
              fillOpacity: baseOpacity + intensityFactor * 0.3,
              weight: 3
            };
          case 'cyclone':
            return {
              color: '#9c27b0',
              fillColor: '#9c27b0',
              fillOpacity: baseOpacity + intensityFactor * 0.3,
              weight: 3
            };
          case 'storm':
            return {
              color: '#ff9800',
              fillColor: '#ff9800',
              fillOpacity: baseOpacity + intensityFactor * 0.2,
              weight: 2
            };
          case 'high_tide':
            return {
              color: '#2196f3',
              fillColor: '#2196f3',
              fillOpacity: baseOpacity + intensityFactor * 0.2,
              weight: 2
            };
          default:
            return {
              color: '#ff9800',
              fillColor: '#ff9800',
              fillOpacity: baseOpacity,
              weight: 2
            };
        }
      };

      const style = getWeatherStyle(weather);
      // Convert km to meters for Leaflet's circle radius
      const radiusMeters = weather.radius * 1000;

      return (
        <Circle
          key={weather.id}
          center={[weather.position.lat, weather.position.lng]}
          radius={radiusMeters}
          pathOptions={{
            ...style,
            dashArray: weather.intensity > 7 ? '10, 5' : '5, 5',
          }}
          eventHandlers={{
            click: () => {
              // Show popup with weather info
              const popup = L.popup()
                .setLatLng([weather.position.lat, weather.position.lng])
                .setContent(`
                  <div style="min-width: 200px;">
                    <h3 style="color: ${style.color}; margin: 0 0 10px 0;">${weather.name}</h3>
                    <p style="margin: 5px 0;">${weather.description}</p>
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0;">
                      <p style="margin: 3px 0;"><strong>Intensity:</strong> ${weather.intensity.toFixed(1)}/10</p>
                      <p style="margin: 3px 0;"><strong>Wave Height:</strong> ${weather.impact.waveHeight.toFixed(1)}m</p>
                      <p style="margin: 3px 0;"><strong>Wind Speed:</strong> ${weather.impact.windSpeed.toFixed(1)} m/s</p>
                      <p style="margin: 3px 0;"><strong>Current Speed:</strong> ${weather.impact.currentSpeed.toFixed(1)} knots</p>
                      <p style="margin: 3px 0;"><strong>Visibility:</strong> ${weather.impact.visibility.toFixed(1)} km</p>
                    </div>
                  </div>
                `)
                .openOn(map);
            },
            mouseover: () => {
              // Add visual feedback on hover
              const circle = document.querySelector(`[data-weather-id="${weather.id}"]`) as HTMLElement;
              if (circle) {
                circle.style.opacity = '0.8';
              }
            },
            mouseout: () => {
              // Remove visual feedback
              const circle = document.querySelector(`[data-weather-id="${weather.id}"]`) as HTMLElement;
              if (circle) {
                circle.style.opacity = '0.6';
              }
            }
          }}
        />
      );
    });
  };

  return (
    <>
      <LayerGroup>
        <MaritimeTileLayer />
        {showControls && <ZoomControl position="topright" />}

        {/* Weather conditions */}
        {extremeWeather.length > 0 && (
          <LayerGroup>{renderWeatherConditions()}</LayerGroup>
        )}

        {enablePortSelection && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '5px 15px',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            pointerEvents: 'auto'
          }}>
            <Typography variant="subtitle2">
              Click on the map to add waypoint port
            </Typography>
          </div>
        )}

        {route.length > 0 ? (
          <>
            {/* Original Maritime Route */}
            <Polyline
              positions={route.map(pos => [pos.lat, pos.lng])}
              color="#1976d2"
              weight={4}
              opacity={0.9}
              smoothFactor={2}
            />

            {/* Alternative Routes */}
            {alternativeRoutes.map((altRoute, index) => (
              <Polyline
                key={`alt-route-${altRoute.id}`}
                positions={altRoute.waypoints.map(wp => [wp.lat, wp.lng])}
                color={selectedRoute && selectedRoute.length > 0 && 
                       selectedRoute[0].name?.includes('Alt Route') ? '#4CAF50' : '#FF9800'}
                weight={2}
                opacity={0.7}
                dashArray="10, 5"
                smoothFactor={2}
              />
            ))}

            {/* Selected Alternative Route (highlighted) */}
            {selectedRoute && selectedRoute.length > 0 && selectedRoute[0].name?.includes('Alt Route') && (
              <Polyline
                positions={selectedRoute.map(pos => [pos.lat, pos.lng])}
                color="#4CAF50"
                weight={4}
                opacity={0.9}
                smoothFactor={2}
              />
            )}

            {/* Waypoint Markers */}
            {route.filter((pos, index) =>
              // Only show waypoint markers for points that aren't start or end
              index > 0 && index < route.length - 1 &&
              // And have a type of waypoint or course_change
              pos.type && ['waypoint', 'course_change'].includes(pos.type)
            ).map((pos, index) => (
              <Marker
                key={`waypoint-${index}-${pos.lat}-${pos.lng}`}
                position={[pos.lat, pos.lng]}
                icon={L.divIcon({
                  html: `<div style="background-color: #FF9800; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white;"></div>`,
                  className: 'waypoint-marker',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              >
                <Popup>
                  <Typography variant="body2">{pos.name || 'Navigation Waypoint'}</Typography>
                  <Typography variant="caption">Lat: {pos.lat.toFixed(4)}, Lng: {pos.lng.toFixed(4)}</Typography>
                </Popup>
              </Marker>
            ))}

            {/* Route Markers */}
            {route.map((pos, index) => {
              // Determine position type
              const positionType = pos.type ||
                (index === 0 ? 'departure' :
                  index === route.length - 1 ? 'destination' : 'waypoint');

              // Create appropriate marker based on type
              const markerIcon = positionType === 'departure' ? createShipIcon() : createPortIcon();
              const markerLabel = positionType.charAt(0).toUpperCase() + positionType.slice(1);

              return (
                <Marker
                  key={`${pos.lat}-${pos.lng}-${index}`}
                  position={[pos.lat, pos.lng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <Box sx={{ p: 1, minWidth: 150 }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        {markerLabel}
                      </Typography>
                      <Typography variant="body2">
                        Lat: {pos.lat.toFixed(4)}, Lng: {pos.lng.toFixed(4)}
                      </Typography>
                      {pos.name && (
                        <Typography variant="body2">
                          {pos.name}
                        </Typography>
                      )}
                    </Box>
                  </Popup>
                </Marker>
              );
            })}
          </>
        ) : (!enablePortSelection && !onPortSelect) ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                textAlign: 'center',
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                pointerEvents: 'auto',
                maxWidth: '80%',
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Route Selected
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a route from the list or create a new one to view it on the map.
              </Typography>
            </Box>
          </div>
        ) : null}
      </LayerGroup>

      <WindLayer
        windData={windData}
        visible={showWindLayer}
        arrowSize={30}
        arrowColor="#FF6B35"
      />
    </>
  );
};

interface MapComponentProps {
  route?: RoutePosition[];
  onMapClick?: (latlng: L.LatLng) => void;
  onPortSelect?: (port: Port) => void;
  showControls?: boolean;
  enablePortSelection?: boolean;
  selectedPortType?: 'departure' | 'destination' | 'waypoint';
  height?: string | number;
  zoom?: number;
  center?: [number, number];
  style?: React.CSSProperties;
  windData?: WindData[];
  showWindLayer?: boolean;
  onWeatherDataUpdate?: (weather: ExtremeWeatherCondition[], alternativeRoutes: AlternativeRoute[]) => void;
  onAlternativeRouteSelect?: (altRoute: AlternativeRoute) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  height = '500px',
  zoom = 2,
  center = [15, 75],
  style = {},
  onMapClick,
  onPortSelect,
  showControls = true,
  enablePortSelection = false,
  selectedPortType = 'waypoint',
  windData = [],
  showWindLayer = false,
  route = [],
  onWeatherDataUpdate,
  onAlternativeRouteSelect,
  ...props
}) => {
  const [selectedRoute, setSelectedRoute] = useState<RoutePosition[] | null>(null);
  const [extremeWeather, setExtremeWeather] = useState<ExtremeWeatherCondition[]>([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);

  const handleSelectAlternativeRoute = (altRoute: AlternativeRoute) => {
    // Convert waypoints to RoutePosition format with required fields
    const routePositions: RoutePosition[] = altRoute.waypoints.map((wp, index) => ({
      lat: wp.lat,
      lng: wp.lng,
      name: `Alt Route ${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`,
      type: 'waypoint' as const,
      // Add any additional required fields with defaults
      timestamp: new Date().toISOString(),
      speed: 0,
      heading: 0,
      status: 'active'
    }));
    setSelectedRoute(routePositions);
    
    // Notify parent component about alternative route selection
    if (onAlternativeRouteSelect) {
      onAlternativeRouteSelect(altRoute);
    }
  };

  const handleApplyWeather = (weather: ExtremeWeatherCondition[], alternativeRoutes?: AlternativeRoute[]) => {
    setExtremeWeather(weather);
    if (alternativeRoutes) {
      setAlternativeRoutes(alternativeRoutes);
    }
    
    // Pass data back to parent component
    if (onWeatherDataUpdate) {
      onWeatherDataUpdate(weather, alternativeRoutes || []);
    }
  };

  return (
    <div style={{ height, ...style }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapContent
          route={route}
          selectedRoute={selectedRoute}
          alternativeRoutes={alternativeRoutes}
          windData={windData}
          showWindLayer={showWindLayer}
          extremeWeather={extremeWeather}
          onMapClick={onMapClick || (() => {})}
          onMarkerClick={() => { }}
          selectedMarker={null}
          showControls={showControls}
          enablePortSelection={enablePortSelection}
          onPortSelect={onPortSelect || (() => {})}
        />

        <WeatherControlPanel
          route={selectedRoute || route}
          onApplyWeather={handleApplyWeather}
          onSelectAlternativeRoute={handleSelectAlternativeRoute}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
