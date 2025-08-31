import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  Upload as UploadIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  Schedule as TimeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { processExcelWindData, formatWindDataSummary, createSampleWindData, ExcelWindData } from '../../utils/excelProcessor';

interface VoyageData {
  originalETA: Date;
  adjustedETA: Date;
  speedOverGround: number;
  speedThroughWater: number;
  fuelConsumption: number;
  fuelCost: number;
  laycanWindow: { start: Date; end: Date };
  meetsLaycan: boolean;
  weatherImpact: {
    windEffect: number;
    waveEffect: number;
    currentEffect: number;
    totalEffect: number;
  };
  alternativeSpeeds: {
    eco: { speed: number; fuelSaving: number; timeDelay: number };
    normal: { speed: number; fuelConsumption: number; eta: Date };
  };
  requiredSpeedAdjustment: {
    newSpeed: number;
    isSafe: boolean;
    reason: string;
  };
}



interface VoyageOptimizationDashboardProps {
  selectedRoute?: any;
  weatherLocations?: any[];
  onWindDataChange?: (windData: any[], showWindLayer: boolean) => void;
  onExcelDataChange?: (excelData: any[]) => void;
  onAlternativeRouteSelect?: (altRoute: any) => void;
}

const VoyageOptimizationDashboard: React.FC<VoyageOptimizationDashboardProps> = ({
  selectedRoute,
  weatherLocations = [],
  onWindDataChange,
  onExcelDataChange,
  onAlternativeRouteSelect
}) => {
  const [voyageData, setVoyageData] = useState<VoyageData | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [windData, setWindData] = useState<any[]>([]);
  const [showWindLayer, setShowWindLayer] = useState(false);

  // Simulate voyage data calculation based on selected route and excel data
  useEffect(() => {
    if (!selectedRoute) return;

    // Calculate alternative speeds based on Excel data
    const calculateAlternativeSpeeds = (
      excelData: ExcelWindData[],
      originalETA: Date,
      weatherImpact: any
    ) => {
      if (excelData.length === 0) {
        return {
          eco: { speed: 12, fuelSaving: 25, timeDelay: 1.2 },
          normal: { speed: 14, fuelConsumption: 160, eta: originalETA }
        };
      }

      // Calculate average ship speed from Excel data
      const avgShipSpeed = excelData.reduce((sum, item) => {
        const speed = typeof item.V_ship === 'number' ? item.V_ship : parseFloat(String(item.V_ship)) || 12;
        return sum + (isNaN(speed) ? 12 : speed);
      }, 0) / excelData.length;

      // Calculate average distance from Excel data
      const avgDistance = excelData.reduce((sum, item) => {
        const distance = typeof item.D === 'number' ? item.D : parseFloat(String(item.D)) || 100;
        return sum + (isNaN(distance) ? 100 : distance);
      }, 0) / excelData.length;

      // Calculate average environmental conditions
      const avgWindSpeed = excelData.reduce((sum, item) => {
        const speed = typeof item.ecmwf_wind_speed === 'number' ? item.ecmwf_wind_speed : parseFloat(String(item.ecmwf_wind_speed)) || 0;
        return sum + (isNaN(speed) ? 0 : speed);
      }, 0) / excelData.length;

      const avgWaveHeight = excelData.reduce((sum, item) => {
        const height = typeof item.ecmwf_wave_height === 'number' ? item.ecmwf_wave_height : parseFloat(String(item.ecmwf_wave_height)) || 0;
        return sum + (isNaN(height) ? 0 : height);
      }, 0) / excelData.length;

      const avgCurrentSpeed = excelData.reduce((sum, item) => {
        const speed = typeof item.ecmwf_current_speed === 'number' ? item.ecmwf_current_speed : parseFloat(String(item.ecmwf_current_speed)) || 0;
        return sum + (isNaN(speed) ? 0 : speed);
      }, 0) / excelData.length;

      // ECO SPEED CALCULATION (15% reduction from normal speed)
      const ecoSpeed = Math.max(8, avgShipSpeed * 0.85); // Minimum 8 knots
      const ecoFuelConsumption = calculateFuelConsumption(ecoSpeed, avgWindSpeed, avgWaveHeight, avgCurrentSpeed);
      const ecoETA = calculateETAForSpeed(ecoSpeed, avgDistance, avgWindSpeed, avgCurrentSpeed, avgWaveHeight);

      // NORMAL SPEED CALCULATION (use average ship speed from Excel)
      const normalSpeed = avgShipSpeed;
      const normalFuelConsumption = calculateFuelConsumption(normalSpeed, avgWindSpeed, avgWaveHeight, avgCurrentSpeed);
      const normalETA = calculateETAForSpeed(normalSpeed, avgDistance, avgWindSpeed, avgCurrentSpeed, avgWaveHeight);

      // Calculate savings and delays
      const fuelSavingPercentage = ((normalFuelConsumption - ecoFuelConsumption) / normalFuelConsumption) * 100;
      const timeDelayHours = ecoETA - normalETA;
      const timeDelayDays = timeDelayHours / 24;

      return {
        eco: {
          speed: Math.round(ecoSpeed * 10) / 10,
          fuelSaving: Math.round(fuelSavingPercentage * 10) / 10,
          timeDelay: Math.round(timeDelayDays * 10) / 10
        },
        normal: {
          speed: Math.round(normalSpeed * 10) / 10,
          fuelConsumption: Math.round(normalFuelConsumption),
          eta: new Date(Date.now() + normalETA * 60 * 60 * 1000)
        }
      };
    };

    // Calculate fuel consumption based on speed and environmental conditions
    const calculateFuelConsumption = (
      speed: number,
      windSpeed: number,
      waveHeight: number,
      currentSpeed: number
    ): number => {
      // Base fuel consumption (MT/day) - cubic relationship with speed
      const baseFuelConsumption = Math.pow(speed / 12, 3) * 160;

      // Environmental impact factors
      const windImpact = windSpeed > 20 ? (windSpeed - 20) * 0.8 : 0;
      const waveImpact = waveHeight > 2 ? (waveHeight - 2) * 3 : 0;
      const currentImpact = currentSpeed > 0 ? -currentSpeed * 1.5 : Math.abs(currentSpeed) * 1;

      return baseFuelConsumption + windImpact + waveImpact + currentImpact;
    };

    // Calculate ETA for a given speed using simplified formula
    const calculateETAForSpeed = (
      speed: number,
      distance: number,
      windSpeed: number,
      currentSpeed: number,
      waveHeight: number
    ): number => {
      // Environmental coefficients
      const k1 = 1.0; // Current effect
      const k2 = 0.1; // Wind resistance
      const k3 = 0.5; // Wave resistance

      // Simplified calculation (assuming 0 degree heading difference)
      const effectiveSpeed = speed + k1 * currentSpeed - k2 * windSpeed - k3 * waveHeight;

      // Ensure minimum speed
      const finalSpeed = Math.max(1, effectiveSpeed);

      return distance / finalSpeed;
    };

    const calculateVoyageData = (): VoyageData => {
      const now = new Date();
      const baseDuration = selectedRoute.id === 1 ? 18 : 12; // days
      const originalETA = new Date(now.getTime() + baseDuration * 24 * 60 * 60 * 1000);

      // Calculate weather impact based on excel data if available
      let weatherImpact = {
        windEffect: -15,
        waveEffect: -8,
        currentEffect: +3,
        totalEffect: -20
      };

      let totalCalculatedETA = 0;
      let totalDistance = 0;
      let avgShipSpeed = 14; // Default ship speed
      let calculatedOriginalETA = originalETA;

      if (excelData.length > 0) {
        // Calculate comprehensive voyage data from Excel
        const avgWindSpeed = excelData.reduce((sum, item) => {
          const speed = typeof item.ecmwf_wind_speed === 'number' ? item.ecmwf_wind_speed : parseFloat(String(item.ecmwf_wind_speed)) || 0;
          return sum + (isNaN(speed) ? 0 : speed);
        }, 0) / excelData.length;

        const avgWaveHeight = excelData.reduce((sum, item) => {
          const height = typeof item.ecmwf_wave_height === 'number' ? item.ecmwf_wave_height : parseFloat(String(item.ecmwf_wave_height)) || 0;
          return sum + (isNaN(height) ? 0 : height);
        }, 0) / excelData.length;

        const avgCurrentSpeed = excelData.reduce((sum, item) => {
          const speed = typeof item.ecmwf_current_speed === 'number' ? item.ecmwf_current_speed : parseFloat(String(item.ecmwf_current_speed)) || 0;
          return sum + (isNaN(speed) ? 0 : speed);
        }, 0) / excelData.length;

        // Calculate total distance and average ship speed from Excel
        totalDistance = excelData.reduce((sum, item) => {
          const distance = typeof item.D === 'number' ? item.D : parseFloat(String(item.D)) || 0;
          return sum + (isNaN(distance) ? 0 : distance);
        }, 0);

        avgShipSpeed = excelData.reduce((sum, item) => {
          const speed = typeof item.V_ship === 'number' ? item.V_ship : parseFloat(String(item.V_ship)) || 14;
          return sum + (isNaN(speed) ? 14 : speed);
        }, 0) / excelData.length;

        // Calculate total ETA using the comprehensive formula for each leg
        totalCalculatedETA = excelData.reduce((sum, item) => {
          const shipSpeed = typeof item.V_ship === 'number' ? item.V_ship : parseFloat(String(item.V_ship)) || avgShipSpeed;
          const windSpeed = typeof item.ecmwf_wind_speed === 'number' ? item.ecmwf_wind_speed : parseFloat(String(item.ecmwf_wind_speed)) || 0;
          const currentSpeed = typeof item.ecmwf_current_speed === 'number' ? item.ecmwf_current_speed : parseFloat(String(item.ecmwf_current_speed)) || 0;
          const currentDirection = typeof item.ecmwf_current_direction === 'number' ? item.ecmwf_current_direction : parseFloat(String(item.ecmwf_current_direction)) || 0;
          const swellDirection = typeof item.ecmwf_swell_direction === 'number' ? item.ecmwf_swell_direction : parseFloat(String(item.ecmwf_swell_direction)) || 0;
          const waveHeight = typeof item.ecmwf_wave_height === 'number' ? item.ecmwf_wave_height : parseFloat(String(item.ecmwf_wave_height)) || 0;
          const distance = typeof item.D === 'number' ? item.D : parseFloat(String(item.D)) || 0;

          // Calculate ETA for this leg using the comprehensive formula
          const k1 = 1.0, k2 = 0.1, k3 = 0.5;
          const shipHeading = 0; // Assume 0 degrees for simplification
          const θ_current = Math.abs(shipHeading - currentDirection) * Math.PI / 180;
          const θ_swell = Math.abs(shipHeading - swellDirection) * Math.PI / 180;

          const effectiveSpeed = shipSpeed + k1 * (currentSpeed * Math.cos(θ_current)) - k2 * windSpeed - k3 * waveHeight * (1 + Math.cos(θ_swell));
          const safeSpeed = Math.max(1, effectiveSpeed);

          return sum + (distance / safeSpeed);
        }, 0);

        // Calculate original ETA without environmental effects (just distance/speed)
        const originalETAHours = totalDistance / avgShipSpeed;
        calculatedOriginalETA = new Date(now.getTime() + originalETAHours * 60 * 60 * 1000);

        console.log(`Calculated voyage data - Total Distance: ${totalDistance.toFixed(1)} nm, Original ETA: ${originalETAHours.toFixed(1)} hours, Environmental ETA: ${totalCalculatedETA.toFixed(1)} hours, Avg Ship Speed: ${avgShipSpeed.toFixed(1)} knots`);

        weatherImpact = {
          windEffect: avgWindSpeed > 25 ? -Math.min(40, (avgWindSpeed - 20) * 2) : -5,
          waveEffect: avgWaveHeight > 3 ? -Math.min(30, (avgWaveHeight - 2) * 5) : -3,
          currentEffect: avgCurrentSpeed > 0 ? Math.min(15, avgCurrentSpeed * 5) : Math.max(-15, avgCurrentSpeed * 3),
          totalEffect: 0
        };
        weatherImpact.totalEffect = weatherImpact.windEffect + weatherImpact.waveEffect + weatherImpact.currentEffect;
      }

      // Use calculated ETA if available, otherwise use base calculation with weather impact
      const finalETAHours = totalCalculatedETA > 0 ? totalCalculatedETA : baseDuration * 24 + (Math.abs(weatherImpact.totalEffect) * 0.1 * 24);
      const adjustedETA = new Date(now.getTime() + finalETAHours * 60 * 60 * 1000);

      // Calculate laycan window based on actual voyage data
      const laycanStartBuffer = totalDistance > 0 ? Math.max(1, totalDistance / 1000) : 1; // 1 day per 1000nm minimum 1 day
      const laycanEndBuffer = totalDistance > 0 ? Math.max(2, totalDistance / 500) : 3; // 1 day per 500nm minimum 2 days

      const laycanWindow = {
        start: new Date(calculatedOriginalETA.getTime() - laycanStartBuffer * 24 * 60 * 60 * 1000),
        end: new Date(calculatedOriginalETA.getTime() + laycanEndBuffer * 24 * 60 * 60 * 1000)
      };

      // Calculate actual speeds based on Excel data
      const actualSpeedOverGround = totalDistance > 0 && totalCalculatedETA > 0 ? totalDistance / totalCalculatedETA : avgShipSpeed;
      const actualSpeedThroughWater = avgShipSpeed;
      const actualFuelConsumption = totalDistance > 0 ? (totalDistance / 24) * (160 / 300) * Math.pow(avgShipSpeed / 12, 3) : 160; // Fuel based on distance and speed

      return {
        originalETA: calculatedOriginalETA,
        adjustedETA,
        speedOverGround: actualSpeedOverGround,
        speedThroughWater: actualSpeedThroughWater,
        fuelConsumption: actualFuelConsumption + Math.abs(weatherImpact.totalEffect) * 1.5,
        fuelCost: (actualFuelConsumption + Math.abs(weatherImpact.totalEffect) * 1.5) * 500,
        laycanWindow,
        meetsLaycan: adjustedETA >= laycanWindow.start && adjustedETA <= laycanWindow.end,
        weatherImpact,
        alternativeSpeeds: calculateAlternativeSpeeds(excelData, calculatedOriginalETA, weatherImpact),
        requiredSpeedAdjustment: {
          newSpeed: avgShipSpeed / (1 + weatherImpact.totalEffect / 100),
          isSafe: (avgShipSpeed / (1 + weatherImpact.totalEffect / 100)) <= 16,
          reason: (14 / (1 + weatherImpact.totalEffect / 100)) > 16 ?
            "Exceeds maximum safe operating speed (16 knots)" :
            "Within safe operating limits"
        }
      };
    };

    setVoyageData(calculateVoyageData());
  }, [selectedRoute, excelData]);

  // Notify parent component when wind data changes
  useEffect(() => {
    if (onWindDataChange) {
      onWindDataChange(windData, showWindLayer);
    }
  }, [windData, showWindLayer, onWindDataChange]);

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        console.log(`Processing Excel file: ${file.name} (${file.size} bytes)`);

        // Process Excel file with real wind data
        const { excelData: processedExcelData, windData: processedWindData } = await processExcelWindData(file);

        console.log(`Successfully loaded ${processedWindData.length} wind measurement points from Excel file`);
        console.log('Wind data sample:', processedWindData.slice(0, 3));

        setExcelData(processedExcelData);
        setWindData(processedWindData);

        // Show wind layer by default when data is loaded
        setShowWindLayer(true);

        // Notify parent component about Excel data change
        if (onExcelDataChange) {
          onExcelDataChange(processedExcelData);
        }

      } catch (error) {
        console.error('Error processing Excel file:', error);

        // Show user-friendly error message
        alert(`Error reading Excel file: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease ensure your Excel file contains columns for:\n- Latitude (lat, latitude)\n- Longitude (lng, lon, longitude)\n- Wind Speed (ecmwf_wind_speed, wind_speed)\n- Wind Direction (ecmwf_wind_dir, wind_dir)\n\nUsing sample data instead.`);

        // Fallback to sample data if processing fails
        const { excelData: sampleExcelData, windData: sampleWindData } = createSampleWindData();
        setExcelData(sampleExcelData);
        setWindData(sampleWindData);
        setShowWindLayer(true);

        // Notify parent component about Excel data change (even with sample data)
        if (onExcelDataChange) {
          onExcelDataChange(sampleExcelData);
        }

        console.log('Using sample wind data as fallback');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLaycanStatus = () => {
    if (!voyageData) return { color: 'default', text: 'Unknown' };
    if (voyageData.meetsLaycan) {
      return { color: 'success', text: 'MEETS LAYCAN' };
    } else {
      return { color: 'error', text: 'MISSES LAYCAN' };
    }
  };

  const getSafetyStatus = () => {
    if (!voyageData) return { color: 'default', text: 'Unknown' };
    if (voyageData.requiredSpeedAdjustment.isSafe) {
      return { color: 'success', text: 'SAFE OPERATION' };
    } else {
      return { color: 'error', text: 'UNSAFE SPEED REQUIRED' };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          🚢 VOYAGE OPTIMIZATION & PERFORMANCE ANALYSIS
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Real-time weather impact analysis, fuel optimization, and ETA management
        </Typography>
      </Paper>

      {/* Excel Upload Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                📊 WEATHER DATA UPLOAD
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                    '&:hover': { background: 'linear-gradient(45deg, #ee5a24, #ff6b6b)' }
                  }}
                >
                  Upload Excel Sheet
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelUpload}
                  />
                </Button>
                {loading && <LinearProgress sx={{ width: 200 }} />}
                {excelData.length > 0 && (
                  <Chip
                    label={`${excelData.length} legs loaded`}
                    color="success"
                    variant="outlined"
                  />
                )}
                {windData.length > 0 && (
                  <Button
                    variant={showWindLayer ? "contained" : "outlined"}
                    color="primary"
                    size="small"
                    onClick={() => setShowWindLayer(!showWindLayer)}
                    startIcon={<span>🌬️</span>}
                    sx={{ ml: 1 }}
                  >
                    {showWindLayer ? 'Hide Wind' : 'Show Wind'}
                  </Button>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload Excel file with columns: ecmwf_wind_speed, ecmwf_wind_dir, Wave Height, Swell Direction, Current
              </Typography>

              {selectedRoute && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Route selected: {selectedRoute.name}. Upload Excel data to see detailed impact analysis.
                </Alert>
              )}

              {windData.length > 0 && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">
                    🌬️ Excel Wind Data Successfully Loaded from Your File
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    📊 {formatWindDataSummary(windData)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Wind arrows are now visible on the map showing direction and speed from your Excel coordinates.
                    Click any arrow for detailed information or use toggle buttons to hide/show all arrows.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      {voyageData && (
        <>
          {/* Key Performance Indicators */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <SpeedIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {voyageData.speedOverGround.toFixed(1)}
                  </Typography>
                  <Typography variant="body2">Speed Over Ground (kts)</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    vs {voyageData.speedThroughWater} kts STW
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <FuelIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {voyageData.fuelConsumption}
                  </Typography>
                  <Typography variant="body2">Fuel Consumption (MT/day)</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    ${voyageData.fuelCost.toLocaleString()}/day
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimeIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    +2.5 Days
                  </Typography>
                  <Typography variant="body2">ETA Delay</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Due to weather
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={2} sx={{ 
                background: voyageData.meetsLaycan 
                  ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' 
                  : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: voyageData.meetsLaycan ? '#2e7d32' : '#d32f2f'
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {getLaycanStatus().text}
                  </Typography>
                  <Typography variant="body2">Laycan Window</Typography>
                  <Typography variant="caption">
                    Status Check
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Weather Impact Analysis */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                    🌊 WEATHER IMPACT ON SPEED
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Wind Effect</Typography>
                      <Typography variant="body2" color="error">
                        {voyageData.weatherImpact.windEffect}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.abs(voyageData.weatherImpact.windEffect)}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Wave Effect</Typography>
                      <Typography variant="body2" color="warning">
                        {voyageData.weatherImpact.waveEffect}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.abs(voyageData.weatherImpact.waveEffect)}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Current Effect</Typography>
                      <Typography variant="body2" color="success">
                        +{voyageData.weatherImpact.currentEffect}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={voyageData.weatherImpact.currentEffect}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Net Effect:
                    </Typography>
                    <Chip
                      label={`${voyageData.weatherImpact.totalEffect}%`}
                      color="error"
                      size="medium"
                      icon={<TrendingDownIcon />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                    ⏰ ETA & LAYCAN ANALYSIS
                  </Typography>

                  {excelData.length > 0 && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 229, 255, 0.1)', borderRadius: 1, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        📊 Voyage Data Summary
                      </Typography>
                      <Typography variant="caption" display="block">
                        Total Distance: {excelData.reduce((sum, item) => {
                          const distance = typeof item.D === 'number' ? item.D : parseFloat(String(item.D)) || 0;
                          return sum + distance;
                        }, 0).toFixed(1)} nm
                      </Typography>
                      <Typography variant="caption" display="block">
                        Average Ship Speed: {(excelData.reduce((sum, item) => {
                          const speed = typeof item.V_ship === 'number' ? item.V_ship : parseFloat(String(item.V_ship)) || 14;
                          return sum + speed;
                        }, 0) / excelData.length).toFixed(1)} knots
                      </Typography>
                      <Typography variant="caption" display="block">
                        Voyage Legs: {excelData.length} segments
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Original ETA (No Weather Impact)
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#4caf50' }}>
                      {formatDate(voyageData.originalETA)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Based on {excelData.length > 0 ? 'actual distance/speed data' : 'estimated voyage duration'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Environmental ETA (With Weather Impact)
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#f44336' }}>
                      {formatDate(voyageData.adjustedETA)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {excelData.length > 0 ? 'Calculated using comprehensive environmental formula' : 'Estimated weather impact'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`${((voyageData.adjustedETA.getTime() - voyageData.originalETA.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)} days ${voyageData.adjustedETA > voyageData.originalETA ? 'delay' : 'early'}`}
                        color={voyageData.adjustedETA > voyageData.originalETA ? 'error' : 'success'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Laycan Window
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {formatDate(voyageData.laycanWindow.start)} - {formatDate(voyageData.laycanWindow.end)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {excelData.length > 0 ? 'Calculated based on voyage distance and complexity' : 'Standard laycan window'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`${((voyageData.laycanWindow.end.getTime() - voyageData.laycanWindow.start.getTime()) / (1000 * 60 * 60 * 24)).toFixed(0)} day window`}
                        color="info"
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Alert
                    severity={voyageData.meetsLaycan ? "success" : "error"}
                    sx={{ mt: 2 }}
                  >
                    <Typography variant="body2">
                      {voyageData.meetsLaycan
                        ? "✅ Vessel will arrive within laycan window"
                        : "❌ Vessel will miss laycan window - consider speed adjustment"}
                    </Typography>
                    {!voyageData.meetsLaycan && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Arrival is {voyageData.adjustedETA < voyageData.laycanWindow.start ? 'too early' : 'too late'} by {' '}
                        {Math.abs((voyageData.adjustedETA.getTime() - (voyageData.adjustedETA < voyageData.laycanWindow.start ? voyageData.laycanWindow.start.getTime() : voyageData.laycanWindow.end.getTime())) / (1000 * 60 * 60 * 24)).toFixed(1)} days
                      </Typography>
                    )}
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Fuel Analysis */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                    ⛽ FUEL CONSUMPTION & COST ANALYSIS
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(26, 26, 26, 0.8)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                        <Typography variant="h4" sx={{ color: '#ff5722', fontWeight: 'bold' }}>
                          {voyageData.fuelConsumption}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          MT/day Current Consumption
                        </Typography>
                        <Typography variant="caption" color="error">
                          +25 MT/day due to weather resistance
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(26, 26, 26, 0.8)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                        <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                          ${voyageData.fuelCost.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Daily Fuel Cost
                        </Typography>
                        <Typography variant="caption" color="error">
                          +$12,500/day extra cost
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(26, 26, 26, 0.8)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                        <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                          2,775
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Voyage Fuel (MT)
                        </Typography>
                        <Typography variant="caption" color="success">
                          15-day voyage estimate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Speed Alternatives */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ border: '2px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
                    🌱 ECO SPEED OPTION
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {voyageData.alternativeSpeeds.eco.speed} kts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recommended Eco Speed
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Fuel Saving:</Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                      {voyageData.alternativeSpeeds.eco.fuelSaving}% less
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Time Impact:</Typography>
                    <Typography variant="body2" sx={{
                      color: voyageData.alternativeSpeeds.eco.timeDelay > 0 ? '#ff9800' : '#4caf50'
                    }}>
                      {voyageData.alternativeSpeeds.eco.timeDelay > 0 ? '+' : ''}{voyageData.alternativeSpeeds.eco.timeDelay} days
                    </Typography>
                  </Box>

                  <Alert severity="success" sx={{ mt: 2 }}>
                    Save {((voyageData.alternativeSpeeds.normal.fuelConsumption * voyageData.alternativeSpeeds.eco.fuelSaving / 100) * 500).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}/day in fuel costs
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ border: '2px solid #2196f3' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2196f3', fontWeight: 600 }}>
                    ⚡ NORMAL SPEED OPTION
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                      {voyageData.alternativeSpeeds.normal.speed} kts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Standard Operating Speed
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Fuel Consumption:</Typography>
                    <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600 }}>
                      {voyageData.alternativeSpeeds.normal.fuelConsumption} MT/day
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">ETA:</Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50' }}>
                      {formatDate(voyageData.alternativeSpeeds.normal.eta)}
                    </Typography>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    Fuel cost: {(voyageData.alternativeSpeeds.normal.fuelConsumption * 500).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}/day
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Speed Adjustment Analysis */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Card elevation={2} sx={{
                border: voyageData.requiredSpeedAdjustment.isSafe ? '2px solid #4caf50' : '2px solid #f44336'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                    🎯 SPEED ADJUSTMENT TO MEET ORIGINAL ETA
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(26, 26, 26, 0.8)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                        <Typography variant="h4" sx={{
                          color: voyageData.requiredSpeedAdjustment.isSafe ? '#4caf50' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {voyageData.requiredSpeedAdjustment.newSpeed}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Required Speed (kts)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          To maintain original schedule
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(26, 26, 26, 0.8)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                        <Typography variant="h4" sx={{ color: '#ff5722', fontWeight: 'bold' }}>
                          220
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fuel Consumption (MT/day)
                        </Typography>
                        <Typography variant="caption" color="error">
                          +60 MT/day at higher speed
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(26, 26, 26, 0.8)', borderRadius: 2, border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                        <Typography variant="h4" sx={{ color: '#ff5722', fontWeight: 'bold' }}>
                          $110K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Daily Fuel Cost
                        </Typography>
                        <Typography variant="caption" color="error">
                          +$30,000/day extra
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Alert
                    severity={voyageData.requiredSpeedAdjustment.isSafe ? "success" : "error"}
                    sx={{ mt: 3 }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {getSafetyStatus().text}
                    </Typography>
                    <Typography variant="body2">
                      {voyageData.requiredSpeedAdjustment.reason}
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Leg-by-Leg Analysis */}
          {excelData.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                      📊 LEG-BY-LEG FUEL CONSUMPTION ANALYSIS
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Leg</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Wind (kts)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Waves (m)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Current (kts)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Speed Impact</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Fuel (MT/day)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Cost/day</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {excelData.map((leg, index) => {
                            // Robust data parsing with type checking
                            const windSpeed = typeof leg.ecmwf_wind_speed === 'number' ? leg.ecmwf_wind_speed : parseFloat(String(leg.ecmwf_wind_speed)) || 0;
                            const windDirection = typeof leg.ecmwf_wind_dir === 'number' ? leg.ecmwf_wind_dir : parseFloat(String(leg.ecmwf_wind_dir)) || 0;
                            const waveHeight = typeof leg.ecmwf_wave_height === 'number' ? leg.ecmwf_wave_height : parseFloat(String(leg.ecmwf_wave_height)) || 0;
                            const currentSpeed = typeof leg.ecmwf_current_speed === 'number' ? leg.ecmwf_current_speed : parseFloat(String(leg.ecmwf_current_speed)) || 0;
                            const currentDirection = typeof leg.ecmwf_current_direction === 'number' ? leg.ecmwf_current_direction : parseFloat(String(leg.ecmwf_current_direction)) || 0;
                            const swellDirection = typeof leg.ecmwf_swell_direction === 'number' ? leg.ecmwf_swell_direction : parseFloat(String(leg.ecmwf_swell_direction)) || 0;
                            const shipSpeed = typeof leg.V_ship === 'number' ? leg.V_ship : parseFloat(String(leg.V_ship)) || 12;
                            const distance = typeof leg.D === 'number' ? leg.D : parseFloat(String(leg.D)) || 100;

                            // Advanced fuel consumption calculation using comprehensive maritime formula
                            const k1 = 1.0, k2 = 0.1, k3 = 0.5; // Environmental coefficients
                            const shipHeading = 0; // Assume 0 degrees for simplification

                            // Calculate angular differences for current and swell impact
                            const θ_current = Math.abs(shipHeading - currentDirection) * Math.PI / 180;
                            const θ_swell = Math.abs(shipHeading - swellDirection) * Math.PI / 180;

                            // Calculate effective speed using comprehensive formula
                            const currentAssistance = k1 * (currentSpeed * Math.cos(θ_current));
                            const windResistance = k2 * windSpeed;
                            const waveResistance = k3 * waveHeight * (1 + Math.cos(θ_swell));

                            const effectiveSpeed = shipSpeed + currentAssistance - windResistance - waveResistance;
                            const safeEffectiveSpeed = Math.max(1, effectiveSpeed);

                            // Calculate speed impact percentage
                            const speedImpact = ((safeEffectiveSpeed - shipSpeed) / shipSpeed) * 100;

                            // Calculate fuel consumption based on speed and environmental conditions
                            // Base fuel consumption follows cubic relationship with speed
                            const baseFuelConsumption = Math.pow(shipSpeed / 12, 3) * 160; // MT/day

                            // Environmental impact on fuel consumption
                            const windImpactFuel = windSpeed > 20 ? (windSpeed - 20) * 0.8 : 0;
                            const waveImpactFuel = waveHeight > 2 ? (waveHeight - 2) * 3 : 0;
                            const currentImpactFuel = currentSpeed > 0 ? -currentSpeed * 1.5 : Math.abs(currentSpeed) * 1;

                            const environmentalFuelImpact = windImpactFuel + waveImpactFuel + currentImpactFuel;
                            const totalFuelConsumption = Math.max(80, baseFuelConsumption + environmentalFuelImpact); // Minimum 80 MT/day

                            // Calculate leg duration and total fuel for this leg
                            const legDurationHours = distance / safeEffectiveSpeed;
                            const legFuelConsumption = (totalFuelConsumption / 24) * legDurationHours; // Total MT for this leg
                            const dailyCost = totalFuelConsumption * 500; // $500 per MT per day
                            const legCost = legFuelConsumption * 500; // Total cost for this leg

                            return (
                              <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.05)' } }}>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  {leg.leg || index + 1}
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {leg.location || `Leg ${index + 1}`}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {windSpeed.toFixed(1)} kts
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      @ {windDirection.toFixed(0)}°
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {waveHeight.toFixed(1)}m
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Swell: {swellDirection.toFixed(0)}°
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                        color: currentSpeed > 0 ? '#4caf50' : '#f44336'
                                      }}
                                    >
                                      {currentSpeed > 0 ? '+' : ''}{currentSpeed.toFixed(1)} kts
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      @ {currentDirection.toFixed(0)}°
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                        color: speedImpact < 0 ? '#f44336' : '#4caf50'
                                      }}
                                    >
                                      {speedImpact > 0 ? '+' : ''}{speedImpact.toFixed(1)}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {safeEffectiveSpeed.toFixed(1)} kts effective
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {totalFuelConsumption.toFixed(0)} MT/day
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {legFuelConsumption.toFixed(1)} MT total
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                      ${dailyCost.toLocaleString()}/day
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ${legCost.toLocaleString()} leg total
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Summary Row */}
                          <TableRow sx={{ bgcolor: 'rgba(0, 229, 255, 0.2)', borderTop: '2px solid rgba(0, 229, 255, 0.6)' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                              VOYAGE TOTALS
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {(excelData.reduce((sum, leg) => {
                                const windSpeed = typeof leg.ecmwf_wind_speed === 'number' ? leg.ecmwf_wind_speed : parseFloat(String(leg.ecmwf_wind_speed)) || 0;
                                return sum + windSpeed;
                              }, 0) / excelData.length).toFixed(1)} kts avg
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {(excelData.reduce((sum, leg) => {
                                const waveHeight = typeof leg.ecmwf_wave_height === 'number' ? leg.ecmwf_wave_height : parseFloat(String(leg.ecmwf_wave_height)) || 0;
                                return sum + waveHeight;
                              }, 0) / excelData.length).toFixed(1)}m avg
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {(excelData.reduce((sum, leg) => {
                                const currentSpeed = typeof leg.ecmwf_current_speed === 'number' ? leg.ecmwf_current_speed : parseFloat(String(leg.ecmwf_current_speed)) || 0;
                                return sum + currentSpeed;
                              }, 0) / excelData.length).toFixed(1)} kts avg
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {(excelData.reduce((sum, leg) => {
                                const shipSpeed = typeof leg.V_ship === 'number' ? leg.V_ship : parseFloat(String(leg.V_ship)) || 12;
                                const windSpeed = typeof leg.ecmwf_wind_speed === 'number' ? leg.ecmwf_wind_speed : parseFloat(String(leg.ecmwf_wind_speed)) || 0;
                                const currentSpeed = typeof leg.ecmwf_current_speed === 'number' ? leg.ecmwf_current_speed : parseFloat(String(leg.ecmwf_current_speed)) || 0;
                                const waveHeight = typeof leg.ecmwf_wave_height === 'number' ? leg.ecmwf_wave_height : parseFloat(String(leg.ecmwf_wave_height)) || 0;

                                const k1 = 1.0, k2 = 0.1, k3 = 0.5;
                                const effectiveSpeed = Math.max(1, shipSpeed + k1 * currentSpeed - k2 * windSpeed - k3 * waveHeight);
                                const speedImpact = ((effectiveSpeed - shipSpeed) / shipSpeed) * 100;
                                return sum + speedImpact;
                              }, 0) / excelData.length).toFixed(1)}% avg
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>
                              {excelData.reduce((sum, leg) => {
                                const shipSpeed = typeof leg.V_ship === 'number' ? leg.V_ship : parseFloat(String(leg.V_ship)) || 12;
                                const windSpeed = typeof leg.ecmwf_wind_speed === 'number' ? leg.ecmwf_wind_speed : parseFloat(String(leg.ecmwf_wind_speed)) || 0;
                                const waveHeight = typeof leg.ecmwf_wave_height === 'number' ? leg.ecmwf_wave_height : parseFloat(String(leg.ecmwf_wave_height)) || 0;
                                const currentSpeed = typeof leg.ecmwf_current_speed === 'number' ? leg.ecmwf_current_speed : parseFloat(String(leg.ecmwf_current_speed)) || 0;
                                const distance = typeof leg.D === 'number' ? leg.D : parseFloat(String(leg.D)) || 100;

                                const baseFuelConsumption = Math.pow(shipSpeed / 12, 3) * 160;
                                const windImpactFuel = windSpeed > 20 ? (windSpeed - 20) * 0.8 : 0;
                                const waveImpactFuel = waveHeight > 2 ? (waveHeight - 2) * 3 : 0;
                                const currentImpactFuel = currentSpeed > 0 ? -currentSpeed * 1.5 : Math.abs(currentSpeed) * 1;
                                const totalFuelConsumption = Math.max(80, baseFuelConsumption + windImpactFuel + waveImpactFuel + currentImpactFuel);

                                const k1 = 1.0, k2 = 0.1, k3 = 0.5;
                                const effectiveSpeed = Math.max(1, shipSpeed + k1 * currentSpeed - k2 * windSpeed - k3 * waveHeight);
                                const legDurationHours = distance / effectiveSpeed;
                                const legFuelConsumption = (totalFuelConsumption / 24) * legDurationHours;

                                return sum + legFuelConsumption;
                              }, 0).toFixed(0)} MT total
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>
                              ${excelData.reduce((sum, leg) => {
                                const shipSpeed = typeof leg.V_ship === 'number' ? leg.V_ship : parseFloat(String(leg.V_ship)) || 12;
                                const windSpeed = typeof leg.ecmwf_wind_speed === 'number' ? leg.ecmwf_wind_speed : parseFloat(String(leg.ecmwf_wind_speed)) || 0;
                                const waveHeight = typeof leg.ecmwf_wave_height === 'number' ? leg.ecmwf_wave_height : parseFloat(String(leg.ecmwf_wave_height)) || 0;
                                const currentSpeed = typeof leg.ecmwf_current_speed === 'number' ? leg.ecmwf_current_speed : parseFloat(String(leg.ecmwf_current_speed)) || 0;
                                const distance = typeof leg.D === 'number' ? leg.D : parseFloat(String(leg.D)) || 100;

                                const baseFuelConsumption = Math.pow(shipSpeed / 12, 3) * 160;
                                const windImpactFuel = windSpeed > 20 ? (windSpeed - 20) * 0.8 : 0;
                                const waveImpactFuel = waveHeight > 2 ? (waveHeight - 2) * 3 : 0;
                                const currentImpactFuel = currentSpeed > 0 ? -currentSpeed * 1.5 : Math.abs(currentSpeed) * 1;
                                const totalFuelConsumption = Math.max(80, baseFuelConsumption + windImpactFuel + waveImpactFuel + currentImpactFuel);

                                const k1 = 1.0, k2 = 0.1, k3 = 0.5;
                                const effectiveSpeed = Math.max(1, shipSpeed + k1 * currentSpeed - k2 * windSpeed - k3 * waveHeight);
                                const legDurationHours = distance / effectiveSpeed;
                                const legFuelConsumption = (totalFuelConsumption / 24) * legDurationHours;
                                const legCost = legFuelConsumption * 500;

                                return sum + legCost;
                              }, 0).toLocaleString()} total
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Summary Recommendations */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3} sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    💡 VOYAGE OPTIMIZATION RECOMMENDATIONS
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          🎯 OPTIMAL STRATEGY
                        </Typography>
                        <Typography variant="body2">
                          • Maintain {voyageData.alternativeSpeeds.eco.speed} knots eco speed for fuel efficiency<br/>
                          • Accept {Math.abs(voyageData.alternativeSpeeds.eco.timeDelay)}-day {voyageData.alternativeSpeeds.eco.timeDelay > 0 ? 'delay' : 'time saving'} to save {voyageData.alternativeSpeeds.eco.fuelSaving}% in fuel costs<br/>
                          • {voyageData.meetsLaycan ? 'Still meets laycan window comfortably' : 'May require schedule adjustment'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          ⚠️ RISK ASSESSMENT
                        </Typography>
                        <Typography variant="body2">
                          • Weather conditions causing {Math.abs(voyageData.weatherImpact.totalEffect).toFixed(1)}% speed {voyageData.weatherImpact.totalEffect < 0 ? 'reduction' : 'increase'}<br/>
                          • Required {voyageData.requiredSpeedAdjustment.newSpeed.toFixed(1)} kts {voyageData.requiredSpeedAdjustment.isSafe ? 'within safe operating limits' : 'exceeds safe operating limits'}<br/>
                          • {voyageData.requiredSpeedAdjustment.isSafe ? 'Proceed with current plan' : 'Consider route optimization or schedule adjustment'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}



      {/* Instructions when no route selected */}
      {!selectedRoute && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={2} sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h4" sx={{ color: 'primary.main', mb: 2 }}>
                🧭
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                Select a Maritime Route to Begin
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Choose a predefined route from the selection panel to start voyage optimization analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Once selected, you can upload Excel weather data to see detailed impact analysis,
                fuel consumption calculations, and ETA predictions.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default VoyageOptimizationDashboard;
