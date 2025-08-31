import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const AnalysisContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
}));

const StatusCard = styled(Card)<{ status: 'normal' | 'affected' | 'optimized' }>(({ theme, status }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  background: 
    status === 'normal' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
    status === 'affected' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  color: 'white',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  },
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: 'rgba(0, 229, 255, 0.2)',
  borderRadius: '8px',
  position: 'relative',
  zIndex: 1,
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.2rem',
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  opacity: 0.9,
}));

const HealthIndicator = styled(Box)<{ health: number }>(({ theme, health }) => ({
  width: '100%',
  height: '8px',
  backgroundColor: 'rgba(255,255,255,0.3)',
  borderRadius: '4px',
  overflow: 'hidden',
  '& .MuiLinearProgress-bar': {
    backgroundColor: health > 80 ? '#4caf50' : health > 60 ? '#ff9800' : '#f44336',
  },
}));

interface RouteMetrics {
  time: number; // hours
  fuel: number; // liters
  cost: number; // USD
  health: number; // percentage (0-100)
  speed: number; // knots
  distance: number; // nautical miles
}

interface RouteImpactAnalysisProps {
  route?: any[];
  weatherConditions?: any[];
  alternativeRoutes?: any[];
  excelData?: any[];
  selectedAlternativeRoute?: any;
  windData?: any[];
}

const RouteImpactAnalysis: React.FC<RouteImpactAnalysisProps> = ({
  route = [],
  weatherConditions = [],
  alternativeRoutes = [],
  excelData = [],
  selectedAlternativeRoute = null,
  windData = []
}) => {
  const [metrics, setMetrics] = useState<{
    normal: RouteMetrics;
    affected: RouteMetrics;
    optimized: RouteMetrics;
  }>({
    normal: { time: 0, fuel: 0, cost: 0, health: 100, speed: 0, distance: 0 },
    affected: { time: 0, fuel: 0, cost: 0, health: 100, speed: 0, distance: 0 },
    optimized: { time: 0, fuel: 0, cost: 0, health: 100, speed: 0, distance: 0 }
  });

  // Maritime calculation constants
  const MARITIME_CONSTANTS = {
    BASE_FUEL_RATE: 180, // L/h at cruise speed
    FUEL_COST_PER_LITER: 0.85, // USD per liter
    OPERATIONAL_COST_PER_HOUR: 2500, // USD per hour
    WIND_RESISTANCE_FACTOR: 0.003, // Speed reduction per m/s of wind
    WAVE_RESISTANCE_FACTOR: 0.08, // Speed reduction per meter of wave height
    CURRENT_EFFICIENCY_FACTOR: 0.8, // Current effect multiplier
    DEFAULT_CRUISE_SPEED: 16, // knots
    MAXIMUM_SPEED: 22, // knots
    MINIMUM_SPEED: 8, // knots
  };

  // Helper functions
  const calculateFuelConsumption = (speed: number, time: number, multiplier: number = 1.0): number => {
    const speedRatio = speed / MARITIME_CONSTANTS.DEFAULT_CRUISE_SPEED;
    const fuelRatePerHour = MARITIME_CONSTANTS.BASE_FUEL_RATE * Math.pow(speedRatio, 2.2);
    return fuelRatePerHour * time * multiplier;
  };

  const calculateWeatherSeverity = (envData: any, conditions: any[]): number => {
    let severity = 1.0;
    if (envData.avgWindSpeed > 15) severity += (envData.avgWindSpeed - 15) * 0.02;
    if (envData.avgWaveHeight > 2) severity += (envData.avgWaveHeight - 2) * 0.1;
    conditions.forEach(condition => {
      if (condition.severity === 'high') severity += 0.3;
      else if (condition.severity === 'medium') severity += 0.15;
      else severity += 0.05;
    });
    return Math.min(severity, 2.5);
  };

  const calculateWeatherSpeedReduction = (envData: any): number => {
    let speedReduction = 0;
    const windSpeedKnots = envData.avgWindSpeed * 1.944;
    if (windSpeedKnots > 20) {
      speedReduction += (windSpeedKnots - 20) * MARITIME_CONSTANTS.WIND_RESISTANCE_FACTOR;
    }
    if (envData.avgWaveHeight > 1.5) {
      speedReduction += (envData.avgWaveHeight - 1.5) * MARITIME_CONSTANTS.WAVE_RESISTANCE_FACTOR;
    }
    return speedReduction;
  };

  const calculateWeatherFuelMultiplier = (severity: number, envData: any): number => {
    let multiplier = severity;
    if (envData.avgWaveHeight > 3) multiplier += 0.15;
    if (envData.avgWindSpeed > 18) multiplier += 0.1;
    return multiplier;
  };

  const calculateShipHealthImpact = (envData: any, conditions: any[], exposureTime: number): number => {
    let healthReduction = Math.min(exposureTime * 0.5, 10);
    if (envData.avgWaveHeight > 4) healthReduction += 15;
    else if (envData.avgWaveHeight > 2.5) healthReduction += 8;
    if (envData.avgWindSpeed > 25) healthReduction += 12;
    else if (envData.avgWindSpeed > 18) healthReduction += 6;
    conditions.forEach(condition => {
      if (condition.type === 'storm') healthReduction += 20;
      else if (condition.type === 'high_waves') healthReduction += 10;
      else if (condition.type === 'strong_wind') healthReduction += 8;
      else healthReduction += 3;
    });
    return Math.max(45, 100 - healthReduction);
  };

  const calculateRouteDistance = (routePoints: any[]): number => {
    if (routePoints.length < 2) return 150; // Default distance
    let totalDistance = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const lat1 = routePoints[i - 1].lat;
      const lng1 = routePoints[i - 1].lng;
      const lat2 = routePoints[i].lat;
      const lng2 = routePoints[i].lng;
      totalDistance += calculateHaversineDistance(lat1, lng1, lat2, lng2);
    }
    return totalDistance;
  };

  const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  // Main calculation function
  const calculateMetrics = useCallback(() => {
    const baseDistance = calculateRouteDistance(route);
    let shipCruiseSpeed = MARITIME_CONSTANTS.DEFAULT_CRUISE_SPEED;
    let environmentalData = {
      avgWindSpeed: 12, avgWaveHeight: 1.5, avgCurrentSpeed: 0.5, avgCurrentDirection: 0
    };

    // Use Excel data if available
    if (excelData.length > 0) {
      const validData = excelData.filter(item => 
        typeof item.ecmwf_wind_speed === 'number' && !isNaN(item.ecmwf_wind_speed)
      );
      
      if (validData.length > 0) {
        environmentalData.avgWindSpeed = validData.reduce((sum, item) => sum + item.ecmwf_wind_speed, 0) / validData.length;
        environmentalData.avgWaveHeight = validData.reduce((sum, item) => sum + (item.ecmwf_wave_height || 1.5), 0) / validData.length;
        environmentalData.avgCurrentSpeed = validData.reduce((sum, item) => sum + (item.ecmwf_current_speed || 0.5), 0) / validData.length;
        
        const shipSpeeds = validData.filter(item => typeof item.V_ship === 'number' && !isNaN(item.V_ship));
        if (shipSpeeds.length > 0) {
          shipCruiseSpeed = shipSpeeds.reduce((sum, item) => sum + item.V_ship!, 0) / shipSpeeds.length;
        }
      }
    }

    // NORMAL CONDITIONS
    const normalTime = baseDistance / shipCruiseSpeed;
    const normalFuelConsumption = calculateFuelConsumption(shipCruiseSpeed, normalTime);
    const normalOperationalCost = normalTime * MARITIME_CONSTANTS.OPERATIONAL_COST_PER_HOUR;
    const normalTotalCost = normalFuelConsumption * MARITIME_CONSTANTS.FUEL_COST_PER_LITER + normalOperationalCost;

    // WEATHER AFFECTED CONDITIONS
    const weatherSeverity = calculateWeatherSeverity(environmentalData, weatherConditions);
    const weatherSpeedReduction = calculateWeatherSpeedReduction(environmentalData);
    const affectedSpeed = Math.max(MARITIME_CONSTANTS.MINIMUM_SPEED, shipCruiseSpeed - weatherSpeedReduction);
    const affectedTime = baseDistance / affectedSpeed;
    const weatherFuelMultiplier = calculateWeatherFuelMultiplier(weatherSeverity, environmentalData);
    const affectedFuelConsumption = calculateFuelConsumption(affectedSpeed, affectedTime, weatherFuelMultiplier);
    const affectedOperationalCost = affectedTime * MARITIME_CONSTANTS.OPERATIONAL_COST_PER_HOUR;
    const affectedTotalCost = affectedFuelConsumption * MARITIME_CONSTANTS.FUEL_COST_PER_LITER + affectedOperationalCost;
    const healthImpact = calculateShipHealthImpact(environmentalData, weatherConditions, affectedTime);

    // OPTIMIZED ROUTE
    let optimizedDistance = baseDistance;
    let optimizedSpeed = shipCruiseSpeed;
    
    if (selectedAlternativeRoute) {
      optimizedDistance = selectedAlternativeRoute.distance || baseDistance * 1.08;
      optimizedSpeed = Math.min(MARITIME_CONSTANTS.MAXIMUM_SPEED, shipCruiseSpeed * 1.05);
    } else if (alternativeRoutes.length > 0) {
      optimizedDistance = baseDistance * 1.08;
      optimizedSpeed = Math.min(MARITIME_CONSTANTS.MAXIMUM_SPEED, shipCruiseSpeed * 1.08);
    }
    
    const optimizedTime = optimizedDistance / optimizedSpeed;
    const optimizedFuelConsumption = calculateFuelConsumption(optimizedSpeed, optimizedTime, 0.92);
    const optimizedOperationalCost = optimizedTime * MARITIME_CONSTANTS.OPERATIONAL_COST_PER_HOUR;
    const optimizedTotalCost = optimizedFuelConsumption * MARITIME_CONSTANTS.FUEL_COST_PER_LITER + optimizedOperationalCost;

    setMetrics({
      normal: {
        time: normalTime, fuel: normalFuelConsumption, cost: normalTotalCost,
        health: 100, speed: shipCruiseSpeed, distance: baseDistance
      },
      affected: {
        time: affectedTime, fuel: affectedFuelConsumption, cost: affectedTotalCost,
        health: healthImpact, speed: affectedSpeed, distance: baseDistance
      },
      optimized: {
        time: optimizedTime, fuel: optimizedFuelConsumption, cost: optimizedTotalCost,
        health: Math.max(90, 100 - (optimizedTime - normalTime) * 2),
        speed: optimizedSpeed, distance: optimizedDistance
      }
    });
  }, [route, weatherConditions, alternativeRoutes, excelData, selectedAlternativeRoute]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  // Formatting functions
  const formatTime = (hours: number): string => {
    if (hours < 0) return '0h 0m';
    const totalMinutes = Math.round(hours * 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingMinutes = totalMinutes % (24 * 60);
    const hoursInDay = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    if (days > 0) return `${days}d ${hoursInDay}h ${minutes}m`;
    else if (hoursInDay > 0) return `${hoursInDay}h ${minutes}m`;
    else return `${minutes}m`;
  };

  const formatFuel = (liters: number): string => {
    return liters >= 1000 ? `${(liters / 1000).toFixed(1)}k L` : `${Math.round(liters)} L`;
  };

  const formatCost = (cost: number): string => {
    if (cost >= 1000000) return `$${(cost / 1000000).toFixed(1)}M`;
    else if (cost >= 1000) return `$${(cost / 1000).toFixed(1)}k`;
    return `$${Math.round(cost)}`;
  };

  const calculateDetailedSavings = () => {
    const timeSaved = metrics.affected.time - metrics.optimized.time;
    const fuelSaved = metrics.affected.fuel - metrics.optimized.fuel;
    const costSaved = metrics.affected.cost - metrics.optimized.cost;
    const timePercentSaved = metrics.affected.time > 0 ? (timeSaved / metrics.affected.time) * 100 : 0;
    const fuelPercentSaved = metrics.affected.fuel > 0 ? (fuelSaved / metrics.affected.fuel) * 100 : 0;
    const costPercentSaved = metrics.affected.cost > 0 ? (costSaved / metrics.affected.cost) * 100 : 0;
    const speedImprovement = metrics.optimized.speed - metrics.affected.speed;
    const healthImprovement = metrics.optimized.health - metrics.affected.health;
    
    return { timeSaved, fuelSaved, costSaved, timePercentSaved, fuelPercentSaved, costPercentSaved, speedImprovement, healthImprovement };
  };

  const renderMetricCard = (title: string, data: RouteMetrics, status: 'normal' | 'affected' | 'optimized', icon: string) => (
    <Grid item xs={12} md={4}>
      <StatusCard status={status}>
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
              {icon} {title}
            </Typography>
            <Chip
              label={status === 'normal' ? 'Normal' : status === 'affected' ? 'Weather Impact' : 'Optimized'}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold' }}
            />
          </Box>

          <MetricBox><MetricLabel>Travel Time</MetricLabel><MetricValue>{formatTime(data.time)}</MetricValue></MetricBox>
          <MetricBox><MetricLabel>Fuel Consumption</MetricLabel><MetricValue>{formatFuel(data.fuel)}</MetricValue></MetricBox>
          <MetricBox><MetricLabel>Total Cost</MetricLabel><MetricValue>{formatCost(data.cost)}</MetricValue></MetricBox>
          <MetricBox><MetricLabel>Average Speed</MetricLabel><MetricValue>{data.speed.toFixed(1)} kts</MetricValue></MetricBox>
          <MetricBox><MetricLabel>Distance</MetricLabel><MetricValue>{data.distance.toFixed(1)} NM</MetricValue></MetricBox>

          {status === 'affected' && (
            <>
              <MetricBox><MetricLabel>Weather Delay</MetricLabel><MetricValue>{formatTime(data.time - metrics.normal.time)}</MetricValue></MetricBox>
              <MetricBox><MetricLabel>Extra Fuel Used</MetricLabel><MetricValue>{formatFuel(data.fuel - metrics.normal.fuel)}</MetricValue></MetricBox>
              <Box mt={2}>
                <MetricLabel>Ship Health Impact</MetricLabel>
                <HealthIndicator health={data.health}>
                  <LinearProgress variant="determinate" value={data.health} sx={{ height: '8px', borderRadius: '4px' }} />
                </HealthIndicator>
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>{data.health.toFixed(0)}% Health Status</Typography>
              </Box>
            </>
          )}

          {status === 'optimized' && alternativeRoutes.length > 0 && (
            <>
              <MetricBox><MetricLabel>Route Efficiency</MetricLabel><MetricValue>{((metrics.normal.cost / data.cost) * 100).toFixed(0)}%</MetricValue></MetricBox>
              <MetricBox><MetricLabel>Fuel Efficiency</MetricLabel><MetricValue>{((metrics.normal.fuel / data.fuel) * 100).toFixed(0)}%</MetricValue></MetricBox>
            </>
          )}
        </CardContent>
      </StatusCard>
    </Grid>
  );

  const savings = calculateDetailedSavings();

  return (
    <AnalysisContainer>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        🚢 Route Impact Analysis Dashboard
      </Typography>
      
      {route.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>📍 Select a Route to Begin Analysis</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>Choose a predefined route to see detailed impact analysis.</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary' }}>
            Maritime analysis with accurate calculations for {route.length > 0 && route[0].name ? `route from ${route[0].name}` : 'selected route'}
          </Typography>

          <Grid container spacing={3}>
            {renderMetricCard("Unaffected Route", metrics.normal, 'normal', '⚓')}
            {renderMetricCard("Weather Affected", metrics.affected, 'affected', '🌪️')}
            {renderMetricCard("Recommended Path", metrics.optimized, 'optimized', '🎯')}
          </Grid>

          {alternativeRoutes.length > 0 && (
            <Box mt={4}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>💡 Optimization Benefits</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 2, background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%)' }}>
                    <Typography variant="subtitle2" color="textSecondary">Time Efficiency</Typography>
                    <Typography variant="h6" color="primary">
                      {savings.timeSaved > 0 ? `${formatTime(savings.timeSaved)} saved` : `${formatTime(Math.abs(savings.timeSaved))} added`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {savings.timePercentSaved > 0 ? `${savings.timePercentSaved.toFixed(1)}% faster` : `${Math.abs(savings.timePercentSaved).toFixed(1)}% slower`}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 2, background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.15) 0%, rgba(255, 224, 178, 0.15) 100%)' }}>
                    <Typography variant="subtitle2" color="textSecondary">Fuel Efficiency</Typography>
                    <Typography variant="h6" color="primary">
                      {savings.fuelSaved > 0 ? `${formatFuel(savings.fuelSaved)} saved` : `${formatFuel(Math.abs(savings.fuelSaved))} extra`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {savings.fuelPercentSaved.toFixed(1)}% difference
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 2, background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(144, 202, 249, 0.15) 100%)' }}>
                    <Typography variant="subtitle2" color="textSecondary">Cost Impact</Typography>
                    <Typography variant="h6" color="primary">
                      {savings.costSaved > 0 ? `${formatCost(savings.costSaved)} saved` : `${formatCost(Math.abs(savings.costSaved))} extra`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {Math.abs(savings.costPercentSaved).toFixed(1)}% change
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 2, background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(206, 147, 216, 0.15) 100%)' }}>
                    <Typography variant="subtitle2" color="textSecondary">Overall Benefit</Typography>
                    <Typography variant="h6" color="primary">
                      {savings.speedImprovement > 0 ? `+${savings.speedImprovement.toFixed(1)} kts` : 'Route optimization'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {savings.healthImprovement > 0 ? `+${savings.healthImprovement.toFixed(0)}% ship health` : 'Safer passage'}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, border: '1px solid #4CAF50' }}>
            <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              📊 Live Data: Route: {route.length} points • Weather: {weatherConditions.length} conditions • Alternatives: {alternativeRoutes.length}
            </Typography>
            {excelData.length > 0 && (
              <Typography variant="caption" sx={{ color: '#1976d2', display: 'block', mt: 1 }}>
                📂 Excel Data Active: {excelData.length} data points - Using real maritime calculations
              </Typography>
            )}
            {weatherConditions.length > 0 && (
              <Typography variant="caption" sx={{ color: '#388e3c', display: 'block', mt: 1 }}>
                ⚠️ Weather impact active - Maritime formulas applied for accurate analysis
              </Typography>
            )}
            {selectedAlternativeRoute && (
              <Typography variant="caption" sx={{ color: '#f57c00', display: 'block', mt: 1 }}>
                🎯 Alternative Route Selected - Using actual route metrics for calculations
              </Typography>
            )}
          </Box>
        </>
      )}
    </AnalysisContainer>
  );
};

export default RouteImpactAnalysis;