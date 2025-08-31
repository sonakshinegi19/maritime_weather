import * as React from 'react';
import { useState } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, List, ListItem, ListItemText, Divider, Button } from '@mui/material';

import 'leaflet/dist/leaflet.css';
import ShipDashboard from '../../components/Ship/ShipDashboard';
import WeatherDisplay from '../../components/Weather/WeatherDisplay';
import MapComponent from '../../components/Map/MapComponent';
import RouteImpactAnalysis from '../../components/Analytics/RouteImpactAnalysis';
import { ExtremeWeatherCondition, AlternativeRoute } from '../../types/weather';

interface Route {
  id: number;
  name: string;
  start: string;
  end: string;
  waypoints: [number, number][];
  distance: string;
  duration: string;
}

const PREDEFINED_ROUTES: Route[] = [
  {
    id: 1,
    name: "Gopalpur to New Harbour",
    start: "Gopalpur",
    end: "New Harbour",
    distance: "12,450 km",
    duration: "18 days",
    waypoints: [
      [30.213982, 32.557983],
      [30.318359, 32.382202],
      [30.945814, 32.306671],
      [31.298117, 32.387159],
      [31.7, 32.1],
      [32.316071, 30.408377],
      [32.863395, 28.905525],
      [33.115811, 28.212434],
      [33.219565, 27.927542],
      [33.328, 27.6298],
      [33.748752, 26.306431],
      [34.011915, 25.478721],
      [34.187436, 24.926664],
      [34.8, 23.0],
      [35.126694, 21.407365],
      [35.845726, 17.902084],
      [36.086854, 16.726588],
      [36.4, 15.2],
      [36.907095, 13.263819],
      [37.209117, 12.110644],
      [37.212689, 12.097004],
      [37.215493, 12.086301],
      [37.283186, 11.827836],
      [37.454891, 11.172235],
      [37.5, 11.0],
      [37.489085, 10.372293],
      [37.4851, 10.1431],
      [37.4, 7.5],
      [37.2, 3.1],
      [36.666667, -0.366667],
      [36.473171, -1.62439],
      [36.377724, -2.244793],
      [36.324512, -2.590675],
      [36.220888, -3.264225],
      [36.158352, -3.670714],
      [36.156455, -3.683043],
      [36.0, -4.7],
      [35.97289, -5.269383],
      [35.968819, -5.354867],
      [35.95, -5.75],
      [36.31906, -7.26966],
      [36.549727, -8.219465],
      [36.8, -9.25],
      [36.83741, -9.36445],
      [37.324914, -10.855872],
      [37.417342, -11.138637],
      [37.717697, -12.057515],
      [38.272734, -13.755544],
      [38.5182, -14.5065],
      [40.0, -20.0],
      [41.125083, -25.565029],
      [41.1999, -25.9351],
      [41.584862, -28.584901],
      [41.790603, -30.001074],
      [42.072366, -31.940532],
      [42.0901, -32.0626],
      [42.340269, -34.863425],
      [42.592324, -37.685353],
      [42.6501, -38.3322],
      [42.706999, -40.001623],
      [42.796183, -42.618304],
      [42.8665, -44.6814],
      [42.807466, -47.493255],
      [42.754804, -50.001652],
      [42.733, -51.0402],
      [42.618612, -52.53975],
      [42.613022, -52.613022],
      [42.2526, -57.3379],
      [41.53046, -62.794754],
      [41.4359, -63.5093],
      [41.222837, -64.632986],
      [40.435954, -68.782982],
      [40.430133, -68.813685],
      [40.413733, -68.900173],
      [40.412386, -68.907278],
      [40.311722, -69.43818],
      [40.3, -69.5],
      [40.419295, -71.289425],
      [40.437172, -71.557579],
      [40.453237, -71.798554],
      [40.535177, -73.027658],
      [40.6, -74.0],
      [40.6061, -74.0456],
      [40.6285, -74.0561],
      [40.6676, -74.0488],
      [40.7081, -73.9779]
    ]
  },
  {
    id: 2,
    name: "Rotterdam to Singapore",
    start: "Rotterdam",
    end: "Singapore",
    distance: "8,750 km",
    duration: "12 days",
    waypoints: [
      [30.213982, 32.557983],
      [29.7, 32.6],
      [27.9, 33.75],
      [27.0, 34.5],
      [23.6, 37.0],
      [20.75, 38.9],
      [16.3, 41.2],
      [15.0, 42.0],
      [12.7, 43.3],
      [12.40439, 43.746586],
      [12.0, 45.0],
      [13.0, 51.0],
      [12.577758, 53.059021],
      [12.2395, 54.7085],
      [11.4317, 58.3951],
      [11.083455, 59.894005],
      [10.866984, 60.825733],
      [10.5802, 62.0601],
      [10.031585, 64.303249],
      [9.934828, 64.698862],
      [9.862937, 64.992809],
      [9.6889, 65.7044],
      [8.881605, 68.858995],
      [8.7613, 69.3291],
      [8.6701, 69.671733],
      [8.582747, 69.999915],
      [8.365148, 70.817426],
      [8.356493, 70.84994],
      [7.8014, 72.9354],
      [6.966807, 75.966807],
      [6.8131, 76.5251],
      [5.8, 80.1],
      [5.9, 81.9],
      [6.1983, 85.9479],
      [6.4664, 90.0],
      [6.7, 94.0],
      [7.0, 97.0],
      [3.2, 100.6],
      [2.0, 102.0],
      [1.1, 103.6]
    ]
  }
];

const Dashboard: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [weatherLocations, setWeatherLocations] = useState<Array<{ lat: number; lng: number; name: string }>>([]);
  const [windData, setWindData] = useState<any[]>([]);
  const [showWindLayer, setShowWindLayer] = useState(false);
  const [extremeWeather, setExtremeWeather] = useState<ExtremeWeatherCondition[]>([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [selectedAlternativeRoute, setSelectedAlternativeRoute] = useState<AlternativeRoute | null>(null);

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    // Set weather locations based on route waypoints (sample a few points)
    const samplePoints = route.waypoints.filter((_, index) => index % 10 === 0).slice(0, 5);
    const weatherLocs = samplePoints.map((point, index) => ({
      lat: point[0],
      lng: point[1],
      name: `Waypoint ${index + 1}`
    }));
    setWeatherLocations(weatherLocs);
  };

  // Handle wind data changes from VoyageOptimizationDashboard
  const handleWindDataChange = (newWindData: any[], showWind: boolean) => {
    setWindData(newWindData);
    setShowWindLayer(showWind);
  };

  // Handle weather and alternative routes from MapComponent
  const handleWeatherDataUpdate = (weather: ExtremeWeatherCondition[], altRoutes: AlternativeRoute[]) => {
    setExtremeWeather(weather);
    setAlternativeRoutes(altRoutes);
    // Clear selected alternative route when new alternatives are generated
    setSelectedAlternativeRoute(null);
  };

  // Handle Excel data changes from VoyageOptimizationDashboard
  const handleExcelDataChange = (newExcelData: any[]) => {
    setExcelData(newExcelData);
  };

  // Handle alternative route selection
  const handleAlternativeRouteSelect = (altRoute: AlternativeRoute) => {
    setSelectedAlternativeRoute(altRoute);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Grid container spacing={3}>
        {/* Ship Dashboard - Full Width */}
        <Grid item xs={12} id="ship-dashboard">
          <ShipDashboard
            selectedRoute={selectedRoute}
            weatherLocations={weatherLocations}
            onWindDataChange={handleWindDataChange}
            onExcelDataChange={handleExcelDataChange}
            onAlternativeRouteSelect={handleAlternativeRouteSelect}
          />
        </Grid>

        {/* Route Selection */}
        <Grid item xs={12} md={4} id="route-management">
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                🗺️ Predefined Routes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a maritime route to view details and weather conditions
              </Typography>

              <List>
                {PREDEFINED_ROUTES.map((route) => (
                  <React.Fragment key={route.id}>
                    <ListItem
                      button
                      selected={selectedRoute?.id === route.id}
                      onClick={() => handleRouteSelect(route)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            {route.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {route.start} → {route.end}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {route.distance} • {route.duration}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {route.id < PREDEFINED_ROUTES.length && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {selectedRoute && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 229, 255, 0.1)', borderRadius: 1, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    📍 Current Route: {selectedRoute.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Waypoints: {selectedRoute.waypoints.length} points
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Distance: {selectedRoute.distance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Est. Duration: {selectedRoute.duration}
                  </Typography>
                </Box>
              )}

              {/* Wind Visualization Control Panel */}
              {windData.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 183, 77, 0.1)', borderRadius: 1, border: '1px solid rgba(255, 183, 77, 0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ mb: 0 }}>
                      🌬️ ECMWF Wind Data Visualization
                    </Typography>
                    <Button
                      variant={showWindLayer ? "contained" : "outlined"}
                      color="warning"
                      size="small"
                      onClick={() => setShowWindLayer(!showWindLayer)}
                      startIcon={<span>🌬️</span>}
                      sx={{
                        fontSize: '0.8rem',
                        minWidth: '100px',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      {showWindLayer ? 'Hide Wind' : 'Show Wind'}
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📊 {windData.length} wind measurement points loaded from Excel data
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Wind arrows are currently {showWindLayer ? 'VISIBLE' : 'HIDDEN'} on the map.
                    Each arrow shows ECMWF wind speed and direction at precise coordinates.
                    Click arrows for detailed information or use toggle to show/hide all arrows.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Route Information & Map */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                🌊 Route Overview & Map
              </Typography>

              {selectedRoute ? (
                <Box>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 3,
                      mb: 2,
                      background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(0, 229, 255, 0.25) 100%)',
                      border: '1px solid rgba(0, 229, 255, 0.4)'
                    }}
                  >
                    <Typography variant="h5" gutterBottom sx={{ color: 'primary.light' }}>
                      {selectedRoute.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          <strong>🚢 Departure:</strong> {selectedRoute.start}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          <strong>🏁 Destination:</strong> {selectedRoute.end}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          <strong>📏 Distance:</strong> {selectedRoute.distance}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          <strong>⏱️ Duration:</strong> {selectedRoute.duration}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <strong>📍 Waypoints:</strong> {selectedRoute.waypoints.length} navigation points
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Paper
                    elevation={1}
                    sx={{
                      p: 0,
                      minHeight: '500px',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '2px solid rgba(0, 229, 255, 0.4)'
                    }}
                  >
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1000,
                      background: 'rgba(26, 26, 26, 0.95)',
                      p: 1,
                      borderRadius: 1,
                      boxShadow: 2,
                      minWidth: '250px'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                          🗺️ {selectedRoute.name}
                        </Typography>
                        {windData.length > 0 && (
                          <Button
                            variant={showWindLayer ? "contained" : "outlined"}
                            color="primary"
                            size="small"
                            onClick={() => setShowWindLayer(!showWindLayer)}
                            startIcon={<span>🌬️</span>}
                            sx={{
                              fontSize: '0.7rem',
                              minWidth: '80px',
                              height: '24px',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            {showWindLayer ? 'Hide' : 'Wind'}
                          </Button>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {selectedRoute.waypoints.length} waypoints • {selectedRoute.distance}
                      </Typography>
                    </Box>
                    <MapComponent
                      route={selectedRoute.waypoints.map((point, index) => ({
                        lat: point[0],
                        lng: point[1],
                        name: index === 0 ? selectedRoute.start :
                              index === selectedRoute.waypoints.length - 1 ? selectedRoute.end :
                              `Waypoint ${index}`,
                        type: index === 0 ? 'departure' :
                              index === selectedRoute.waypoints.length - 1 ? 'destination' :
                              'waypoint'
                      }))}
                      onMapClick={() => {}}
                      height="500px"
                      zoom={2}
                      center={[
                        selectedRoute.waypoints[Math.floor(selectedRoute.waypoints.length / 2)][0],
                        selectedRoute.waypoints[Math.floor(selectedRoute.waypoints.length / 2)][1]
                      ]}
                      style={{ width: '100%', height: '500px' }}
                      windData={windData}
                      showWindLayer={showWindLayer}
                      onWeatherDataUpdate={handleWeatherDataUpdate}
                      onAlternativeRouteSelect={handleAlternativeRouteSelect}
                    />
                  </Paper>
                </Box>
              ) : (
                <Box>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 3,
                      mb: 2,
                      textAlign: 'center',
                      bgcolor: 'rgba(0, 229, 255, 0.1)',
                      border: '1px solid rgba(0, 229, 255, 0.3)'
                    }}
                  >
                    <Typography variant="h4" sx={{ color: 'primary.main', mb: 2 }}>
                      🧭
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Select a Maritime Route
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose a predefined route from the list to view the complete path and weather conditions
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={1}
                    sx={{
                      p: 0,
                      minHeight: '400px',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '2px dashed rgba(176, 190, 197, 0.3)'
                    }}
                  >
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1000,
                      background: 'rgba(26, 26, 26, 0.95)',
                      p: 1,
                      borderRadius: 1,
                      boxShadow: 2,
                      minWidth: '250px'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                          🌍 World Maritime Map
                        </Typography>
                        {windData.length > 0 && (
                          <Button
                            variant={showWindLayer ? "contained" : "outlined"}
                            color="primary"
                            size="small"
                            onClick={() => setShowWindLayer(!showWindLayer)}
                            startIcon={<span>🌬️</span>}
                            sx={{
                              fontSize: '0.7rem',
                              minWidth: '80px',
                              height: '24px',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            {showWindLayer ? 'Hide' : 'Wind'}
                          </Button>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Select a route to view navigation path
                      </Typography>
                    </Box>
                    <MapComponent
                      route={[]}
                      onMapClick={() => {}}
                      height="400px"
                      zoom={2}
                      center={[20, 0]}
                      style={{ width: '100%', height: '400px' }}
                      windData={windData}
                      showWindLayer={showWindLayer}
                      onWeatherDataUpdate={handleWeatherDataUpdate}
                      onAlternativeRouteSelect={handleAlternativeRouteSelect}
                    />
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Route Impact Analysis Dashboard */}
        <Grid item xs={12}>
          <RouteImpactAnalysis
            route={selectedRoute ? selectedRoute.waypoints.map((point, index) => ({
              lat: point[0],
              lng: point[1],
              name: index === 0 ? selectedRoute.start :
                    index === selectedRoute.waypoints.length - 1 ? selectedRoute.end :
                    `Waypoint ${index}`,
              type: index === 0 ? 'departure' :
                    index === selectedRoute.waypoints.length - 1 ? 'destination' :
                    'waypoint'
            })) : []}
            weatherConditions={extremeWeather}
            alternativeRoutes={alternativeRoutes}
            excelData={excelData}
            selectedAlternativeRoute={selectedAlternativeRoute}
            windData={windData}
          />
        </Grid>



        {/* Weather Display */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                🌤️ Weather Information
              </Typography>
              {selectedRoute ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Weather conditions along the {selectedRoute.name} route
                  </Typography>
                  <WeatherDisplay locations={weatherLocations} />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a route to view weather conditions along the path
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
