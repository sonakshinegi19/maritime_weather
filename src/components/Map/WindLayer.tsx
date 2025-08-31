import React, { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface WindData {
  lat: number;
  lng: number;
  speed: number; // ECMWF wind speed in m/s or knots
  direction: number; // ECMWF wind direction in degrees (0-360)
  location?: string;
  currentSpeed?: number; // ECMWF current speed
  currentDirection?: number; // ECMWF current direction
  swellDirection?: number; // ECMWF swell direction
  waveHeight?: number; // ECMWF wave height
  shipSpeed?: number; // Ship base speed
  distanceToDestination?: number; // Distance to destination
  eta?: number; // Calculated ETA in hours
}

interface WindLayerProps {
  windData: WindData[];
  visible: boolean;
  arrowSize?: number;
  arrowColor?: string;
}

const WindLayer: React.FC<WindLayerProps> = ({ 
  windData, 
  visible, 
  arrowSize = 30,
  arrowColor = '#FF6B35' 
}) => {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Create wind arrow icon
  const createWindArrow = useCallback((speed: number, direction: number) => {
    // Normalize speed for arrow size (assuming max 30 m/s for scaling)
    const normalizedSpeed = Math.min(speed / 30, 1);
    const arrowLength = Math.max(arrowSize * normalizedSpeed, 15); // Minimum size 15px
    const arrowWidth = arrowLength * 0.3;
    
    // Convert meteorological direction (where wind comes from) to mathematical direction (where wind goes to)
    const mathDirection = (direction + 180) % 360;
    
    return L.divIcon({
      html: `
        <div style="
          width: ${arrowLength}px; 
          height: ${arrowLength}px; 
          transform: rotate(${mathDirection}deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="${arrowLength}" height="${arrowLength}" viewBox="0 0 ${arrowLength} ${arrowLength}" style="overflow: visible;">
            <!-- Arrow shaft -->
            <line 
              x1="${arrowLength/2}" 
              y1="${arrowLength * 0.8}" 
              x2="${arrowLength/2}" 
              y2="${arrowLength * 0.2}" 
              stroke="${arrowColor}" 
              stroke-width="3" 
              stroke-linecap="round"
            />
            <!-- Arrow head -->
            <polygon 
              points="${arrowLength/2},${arrowLength * 0.1} ${arrowLength/2 - arrowWidth/2},${arrowLength * 0.3} ${arrowLength/2 + arrowWidth/2},${arrowLength * 0.3}" 
              fill="${arrowColor}"
            />
            <!-- Speed indicator circle -->
            <circle 
              cx="${arrowLength/2}" 
              cy="${arrowLength * 0.9}" 
              r="${Math.max(3, normalizedSpeed * 5)}" 
              fill="${arrowColor}" 
              opacity="0.7"
            />
          </svg>
        </div>
      `,
      className: 'wind-arrow',
      iconSize: [arrowLength, arrowLength],
      iconAnchor: [arrowLength/2, arrowLength/2],
      popupAnchor: [0, -arrowLength/2]
    });
  }, [arrowSize, arrowColor]);

  // Format wind speed for display
  const formatWindSpeed = (speed: number) => {
    return `${speed.toFixed(1)} m/s (${(speed * 1.944).toFixed(1)} kts)`;
  };

  // Format wind direction for display
  const formatWindDirection = (direction: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(direction / 22.5) % 16;
    return `${direction.toFixed(0)}° (${directions[index]})`;
  };

  // Effect to handle layer visibility and data changes
  useEffect(() => {
    if (!map) return;

    // Initialize layer group if it doesn't exist
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup();
    } else {
      // Clear existing markers if any
      layerGroupRef.current.clearLayers();
    }

    // Remove layer from map if it's currently added
    if (map.hasLayer(layerGroupRef.current)) {
      map.removeLayer(layerGroupRef.current);
    }

    // Only add markers if visible and we have data
    if (visible && windData.length > 0) {
      // Add wind arrows to the layer
      windData.forEach((wind, index) => {
        const windArrow = createWindArrow(wind.speed, wind.direction);
        
        const marker = L.marker([wind.lat, wind.lng], { icon: windArrow });
        
        // Add popup with wind information
        const popupContent = `
          <div style="font-family: Arial, sans-serif; min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: #1976d2; font-size: 14px;">
              🌬️ Wind Data ${wind.location ? `- ${wind.location}` : `#${index + 1}`}
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
              <div>
                <strong>🌬️ Wind Speed:</strong><br>
                ${formatWindSpeed(wind.speed)}
              </div>
              <div>
                <strong>🧭 Direction:</strong><br>
                ${formatWindDirection(wind.direction)}
              </div>
              ${wind.currentSpeed !== undefined ? `
                <div>
                  <strong>🌊 Current:</strong><br>
                  ${wind.currentSpeed.toFixed(1)} knots
                </div>
                <div>
                  <strong>🧭 Current Dir:</strong><br>
                  ${wind.currentDirection?.toFixed(0) || 0}°
                </div>
              ` : ''}
              ${wind.waveHeight !== undefined ? `
                <div>
                  <strong>🌊 Wave Height:</strong><br>
                  ${wind.waveHeight.toFixed(1)}m
                </div>
                <div>
                  <strong>🌊 Swell Dir:</strong><br>
                  ${wind.swellDirection?.toFixed(0) || 0}°
                </div>
              ` : ''}
              ${wind.shipSpeed !== undefined ? `
                <div>
                  <strong>🚢 Ship Speed:</strong><br>
                  ${wind.shipSpeed.toFixed(1)} knots
                </div>
                <div>
                  <strong>📏 Distance:</strong><br>
                  ${wind.distanceToDestination?.toFixed(1) || 0} nm
                </div>
              ` : ''}
              ${wind.eta !== undefined ? `
                <div style="grid-column: 1 / -1; background: #e3f2fd; padding: 4px; border-radius: 4px;">
                  <strong>⏱️ Calculated ETA:</strong> ${wind.eta.toFixed(1)} hours
                </div>
              ` : ''}
              <div style="grid-column: 1 / -1;">
                <strong>📍 Coordinates:</strong><br>
                ${wind.lat.toFixed(4)}°, ${wind.lng.toFixed(4)}°
              </div>
            </div>
            <div style="margin-top: 8px; padding: 4px; background: #f5f5f5; border-radius: 4px; font-size: 11px; color: #666;">
              <strong>Note:</strong> Arrow shows wind direction. ETA calculated using ECMWF environmental data and your Excel file parameters.
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        layerGroupRef.current!.addLayer(marker);
      });

      // Add layer to map if visible
      if (visible) {
        map.addLayer(layerGroupRef.current);
      }
    }

    // Cleanup function
    return () => {
      if (layerGroupRef.current && map) {
        // Only remove if we're the ones who added it
        if (map.hasLayer(layerGroupRef.current)) {
          map.removeLayer(layerGroupRef.current);
        }
        // Clear the layer group
        layerGroupRef.current.clearLayers();
      }
    };
  }, [map, windData, visible, arrowSize, arrowColor, createWindArrow]);

  // Effect to handle just the visibility toggle
  useEffect(() => {
    if (!map || !layerGroupRef.current) return;

    if (visible) {
      if (!map.hasLayer(layerGroupRef.current)) {
        map.addLayer(layerGroupRef.current);
      }
    } else {
      if (map.hasLayer(layerGroupRef.current)) {
        map.removeLayer(layerGroupRef.current);
      }
    }
  }, [visible, map]);

  return null; // This component doesn't render anything directly
};

export default WindLayer;
