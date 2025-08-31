import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  Thermostat as TempIcon,
  Air as WindIcon,
  Waves as WaveIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { WeatherData, getWeatherData, getWindDirection, getWeatherIcon } from '../../services/weatherService';

interface WeatherDisplayProps {
  locations?: Array<{ lat: number; lng: number; name: string }>;
  showForecast?: boolean;
  compact?: boolean;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ 
  locations = [], 
  showForecast = true,
  compact = false 
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locations.length > 0) {
      fetchWeatherData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const weatherPromises = locations.map(location => 
        getWeatherData(location.lat, location.lng, location.name)
      );
      
      const data = await Promise.all(weatherPromises);
      setWeatherData(data);
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (locations.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Weather Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Select a route to view weather conditions along your path
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading weather data...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  const allAlerts = weatherData.flatMap(data => data.alerts);

  return (
    <Box>
      {/* Weather Alerts */}
      {allAlerts.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" color="warning.dark">
              Weather Alerts ({allAlerts.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allAlerts.slice(0, 3).map((alert, index) => (
              <Chip
                key={index}
                label={alert.message}
                color={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                size="small"
                variant="outlined"
              />
            ))}
            {allAlerts.length > 3 && (
              <Chip label={`+${allAlerts.length - 3} more`} size="small" variant="outlined" />
            )}
          </Box>
        </Paper>
      )}

      {/* Weather Data for Each Location */}
      <Grid container spacing={2}>
        {weatherData.map((data, index) => (
          <Grid item xs={12} md={compact ? 12 : 6} key={index}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3">
                    {data.location.name}
                  </Typography>
                  <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                    {getWeatherIcon(data.current.condition)} {data.current.temperature}°C
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {data.current.condition}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Wind */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WindIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {data.current.windSpeed} kts
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getWindDirection(data.current.windDirection)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Waves */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WaveIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {data.marine.waveHeight}m
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Waves
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Visibility */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VisibilityIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {data.current.visibility} nm
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Visibility
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Sea Temperature */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TempIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {data.marine.seaTemperature}°C
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sea Temp
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Marine Details */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Swell: {data.marine.swellHeight}m
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tide: {data.marine.tideLevel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pressure: {data.current.pressure} hPa
                  </Typography>
                </Box>

                {/* Forecast */}
                {showForecast && !compact && data.forecast.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      5-Day Forecast
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                      {data.forecast.slice(0, 5).map((day, dayIndex) => (
                        <Box 
                          key={dayIndex} 
                          sx={{ 
                            minWidth: 80, 
                            textAlign: 'center',
                            p: 1,
                            bgcolor: 'background.default',
                            borderRadius: 1
                          }}
                        >
                          <Typography variant="caption" display="block">
                            {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                          </Typography>
                          <Typography variant="body2">
                            {getWeatherIcon(day.condition)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {day.temperature.max}°/{day.temperature.min}°
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {day.windSpeed}kts
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WeatherDisplay;
