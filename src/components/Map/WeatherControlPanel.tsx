import React, { useState } from 'react';
import { Button, Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';
import { getExtremeWeatherConditions, getAlternativeRoutes, getRouteWeatherImpact } from '../../services/weatherService';
import { AlternativeRoute } from '../../types/weather';
import { RoutePosition } from './MapComponent';

// Using RoutePosition from MapComponent

interface WeatherControlPanelProps {
  route: RoutePosition[];
  onApplyWeather: (weather: any[], alternativeRoutes?: AlternativeRoute[]) => void;
  onSelectAlternativeRoute: (route: AlternativeRoute) => void;
}

const WeatherControlPanel: React.FC<WeatherControlPanelProps> = ({
  route,
  onApplyWeather,
  onSelectAlternativeRoute
}) => {
  const [extremeWeatherEnabled, setExtremeWeatherEnabled] = useState(false);
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [weatherImpact, setWeatherImpact] = useState<{severity: string, message: string} | null>(null);

  const handleToggleExtremeWeather = () => {
    console.log('Toggle extreme weather called. Route length:', route?.length || 0);
    
    if (!route || route.length === 0) {
      alert('No route selected. Please select a predefined route first from the route list on the left.');
      return;
    }
    
    if (extremeWeatherEnabled) {
      console.log('Clearing extreme weather conditions');
      // Reset weather
      onApplyWeather([], []);
      setAlternativeRoutes([]);
      setSelectedRoute(null);
      setWeatherImpact(null);
    } else {
      console.log('Applying extreme weather conditions');
      
      // Convert RoutePosition to Position for weather service
      const positions = route.map(rp => ({
        lat: rp.lat,
        lng: rp.lng,
        name: rp.name || `Waypoint ${rp.lat.toFixed(4)}, ${rp.lng.toFixed(4)}`
      }));
      
      // Apply extreme weather conditions along the route
      const weather = getExtremeWeatherConditions(positions);
      console.log('Generated weather conditions:', weather);
      
      try {
        // Calculate alternative routes using the same weather conditions
        const alternatives = getAlternativeRoutes(positions, 3, weather);
        console.log('Generated alternative routes:', alternatives);
        setAlternativeRoutes(alternatives);
        
        // Apply weather and alternative routes to map
        onApplyWeather(weather, alternatives);
        
        // Calculate weather impact on original route
        const impact = getRouteWeatherImpact(positions, weather);
        console.log('Weather impact assessment:', impact);
        setWeatherImpact(impact);
      } catch (error) {
        console.error('Error calculating alternatives or weather impact:', error);
        // Still apply weather even if alternatives fail
        onApplyWeather(weather);
      }
    }
    
    setExtremeWeatherEnabled(!extremeWeatherEnabled);
  };

  const handleSelectRoute = (altRoute: AlternativeRoute) => {
    setSelectedRoute(altRoute.id);
    onSelectAlternativeRoute(altRoute);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'absolute', 
        bottom: 20, 
        right: 20, 
        width: 350, 
        maxHeight: '70vh',
        overflow: 'auto',
        zIndex: 1000,
        p: 2
      }}
    >
      <Box sx={{ mb: 2 }}>
        {(!route || route.length === 0) && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              ⚠️ No route selected. Please select a predefined route first to enable weather conditions.
            </Typography>
          </Box>
        )}
        
        <Button
          variant="contained"
          color={extremeWeatherEnabled ? "error" : "primary"}
          onClick={handleToggleExtremeWeather}
          fullWidth
          disabled={!route || route.length === 0}
          startIcon={extremeWeatherEnabled ? '🌪️' : '⚠️'}
        >
          {extremeWeatherEnabled ? 'Clear Weather Conditions' : 'Impose Heavy Weather Conditions'}
        </Button>
      </Box>

      {weatherImpact && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Weather Impact on Current Route:
          </Typography>
          <Chip 
            label={weatherImpact.message}
            color={
              weatherImpact.severity === 'high' ? 'error' : 
              weatherImpact.severity === 'medium' ? 'warning' : 'success'
            }
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
      )}

      {alternativeRoutes.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Fuel-Efficient Alternative Routes:
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Routes slightly deviate from original path to avoid weather
          </Typography>
          <List dense>
            {alternativeRoutes.map((altRoute) => (
              <React.Fragment key={altRoute.id}>
                <ListItem 
                  button 
                  selected={selectedRoute === altRoute.id}
                  onClick={() => handleSelectRoute(altRoute)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: selectedRoute === altRoute.id ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={`Efficient Route ${altRoute.id.includes('efficient') ? altRoute.id.slice(-4) : (altRoute.id.slice(-4))}`}
                    secondary={
                      <span>
                        {altRoute.distance.toFixed(1)} NM • {altRoute.duration.toFixed(1)} hrs • 
                        {' '}Fuel: {altRoute.fuelConsumption.toFixed(1)}t • 
                        {' '}Safety: {altRoute.safetyScore}/10
                      </span>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
          
          {selectedRoute && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="body2">
                Alternative route selected. Ship states will be updated based on the new route.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default WeatherControlPanel;
