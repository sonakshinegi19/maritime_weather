import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, Slider } from '@mui/material';

interface EngineData {
  rpm: number;
  temperature: number;
  oilPressure: number;
  fuelFlow: number;
  throttlePosition: number;
  status: 'running' | 'idle' | 'starting' | 'stopped' | 'fault';
}

interface EngineControlPanelProps {
  engineCount?: number;
  onThrottleChange?: (engineId: number, throttle: number) => void;
  onEngineStart?: (engineId: number) => void;
  onEngineStop?: (engineId: number) => void;
}

const EngineControlPanel: React.FC<EngineControlPanelProps> = ({
  engineCount = 2,
  onThrottleChange,
  onEngineStart,
  onEngineStop
}) => {
  const [engines, setEngines] = useState<EngineData[]>([]);
  const [selectedEngine, setSelectedEngine] = useState(0);

  // Initialize engines
  useEffect(() => {
    const initialEngines: EngineData[] = [];
    for (let i = 0; i < engineCount; i++) {
      initialEngines.push({
        rpm: 800 + Math.random() * 200,
        temperature: 75 + Math.random() * 10,
        oilPressure: 40 + Math.random() * 10,
        fuelFlow: 15 + Math.random() * 5,
        throttlePosition: 25,
        status: 'running'
      });
    }
    setEngines(initialEngines);
  }, [engineCount]);

  // Simulate engine data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setEngines(prev => prev.map(engine => ({
        ...engine,
        rpm: engine.status === 'running' 
          ? Math.max(600, Math.min(2500, engine.rpm + (Math.random() - 0.5) * 50))
          : engine.status === 'idle' ? 800 + (Math.random() - 0.5) * 50 : 0,
        temperature: engine.status === 'running'
          ? Math.max(70, Math.min(110, engine.temperature + (Math.random() - 0.5) * 2))
          : Math.max(20, engine.temperature - 0.5),
        oilPressure: engine.status === 'running'
          ? Math.max(30, Math.min(70, engine.oilPressure + (Math.random() - 0.5) * 2))
          : 0,
        fuelFlow: engine.status === 'running'
          ? Math.max(5, Math.min(50, engine.fuelFlow + (Math.random() - 0.5) * 2))
          : 0
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleThrottleChange = (engineId: number, value: number) => {
    setEngines(prev => prev.map((engine, index) => 
      index === engineId 
        ? { ...engine, throttlePosition: value }
        : engine
    ));
    onThrottleChange?.(engineId, value);
  };

  const handleEngineControl = (engineId: number, action: 'start' | 'stop') => {
    setEngines(prev => prev.map((engine, index) => 
      index === engineId 
        ? { 
            ...engine, 
            status: action === 'start' ? 'starting' : 'stopped',
            rpm: action === 'start' ? 800 : 0
          }
        : engine
    ));

    // Simulate startup/shutdown sequence
    setTimeout(() => {
      setEngines(prev => prev.map((engine, index) => 
        index === engineId 
          ? { ...engine, status: action === 'start' ? 'running' : 'stopped' }
          : engine
      ));
    }, 2000);

    if (action === 'start') {
      onEngineStart?.(engineId);
    } else {
      onEngineStop?.(engineId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#00ff41';
      case 'idle': return '#ffff00';
      case 'starting': return '#ff8800';
      case 'stopped': return '#666666';
      case 'fault': return '#ff4444';
      default: return '#ffffff';
    }
  };

  const renderEngineGauge = (value: number, max: number, label: string, unit: string, color: string) => {
    const percentage = (value / max) * 100;
    const angle = (percentage / 100) * 180 - 90; // 180 degree arc

    return (
      <Box sx={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80">
          {/* Background arc */}
          <path
            d="M 10 70 A 30 30 0 0 1 70 70"
            fill="none"
            stroke={color}
            strokeWidth="3"
            opacity="0.2"
          />
          
          {/* Value arc */}
          <path
            d={`M 10 70 A 30 30 0 ${percentage > 50 ? 1 : 0} 1 ${40 + 30 * Math.cos(angle * Math.PI / 180)} ${40 + 30 * Math.sin(angle * Math.PI / 180)}`}
            fill="none"
            stroke={color}
            strokeWidth="3"
            opacity="0.8"
            filter={`drop-shadow(0 0 3px ${color})`}
          />

          {/* Center value */}
          <text
            x="40"
            y="35"
            fill={color}
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {Math.round(value)}
          </text>
          <text
            x="40"
            y="45"
            fill={color}
            fontSize="8"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {unit}
          </text>
        </svg>
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: color,
            fontFamily: 'monospace',
            fontSize: '8px'
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      elevation={6}
      sx={{
        p: 2,
        bgcolor: '#000811',
        border: '2px solid #00ff41',
        borderRadius: 2,
        boxShadow: '0 0 20px #00ff4140',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#00ff41',
          textAlign: 'center',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          mb: 2,
          textShadow: '0 0 5px #00ff41',
        }}
      >
        ENGINE CONTROL PANEL
      </Typography>

      {/* Engine Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {engines.map((_, index) => (
          <Button
            key={index}
            variant={selectedEngine === index ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSelectedEngine(index)}
            sx={{
              mx: 0.5,
              color: selectedEngine === index ? '#000000' : '#00ff41',
              borderColor: '#00ff41',
              bgcolor: selectedEngine === index ? '#00ff41' : 'transparent',
              fontFamily: 'monospace',
              minWidth: '60px',
            }}
          >
            ENG {index + 1}
          </Button>
        ))}
      </Box>

      {engines.length > 0 && (
        <Box>
          {/* Selected Engine Status */}
          <Box
            sx={{
              bgcolor: '#001122',
              p: 1,
              mb: 2,
              borderRadius: 1,
              border: `1px solid ${getStatusColor(engines[selectedEngine].status)}`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: getStatusColor(engines[selectedEngine].status),
                textAlign: 'center',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              ENGINE {selectedEngine + 1} - {engines[selectedEngine].status}
            </Typography>
          </Box>

          {/* Engine Gauges */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              {renderEngineGauge(
                engines[selectedEngine].rpm,
                2500,
                'RPM',
                'RPM',
                '#00ffff'
              )}
            </Grid>
            <Grid item xs={3}>
              {renderEngineGauge(
                engines[selectedEngine].temperature,
                120,
                'TEMP',
                '°C',
                engines[selectedEngine].temperature > 100 ? '#ff4444' : '#00ff41'
              )}
            </Grid>
            <Grid item xs={3}>
              {renderEngineGauge(
                engines[selectedEngine].oilPressure,
                80,
                'OIL',
                'PSI',
                '#ffff00'
              )}
            </Grid>
            <Grid item xs={3}>
              {renderEngineGauge(
                engines[selectedEngine].fuelFlow,
                60,
                'FUEL',
                'L/H',
                '#ff8800'
              )}
            </Grid>
          </Grid>

          {/* Throttle Control */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#00ff41',
                fontFamily: 'monospace',
                mb: 1,
              }}
            >
              THROTTLE POSITION: {engines[selectedEngine].throttlePosition}%
            </Typography>
            <Slider
              value={engines[selectedEngine].throttlePosition}
              onChange={(_, value) => handleThrottleChange(selectedEngine, value as number)}
              min={0}
              max={100}
              disabled={engines[selectedEngine].status !== 'running'}
              sx={{
                color: '#00ff41',
                '& .MuiSlider-thumb': {
                  bgcolor: '#00ff41',
                  boxShadow: '0 0 10px #00ff41',
                },
                '& .MuiSlider-track': {
                  bgcolor: '#00ff41',
                  boxShadow: '0 0 5px #00ff41',
                },
                '& .MuiSlider-rail': {
                  bgcolor: '#003311',
                },
              }}
            />
          </Box>

          {/* Engine Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleEngineControl(selectedEngine, 'start')}
              disabled={engines[selectedEngine].status === 'running' || engines[selectedEngine].status === 'starting'}
              sx={{
                bgcolor: '#00ff41',
                color: '#000000',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: '#00cc33',
                },
                '&:disabled': {
                  bgcolor: '#333333',
                  color: '#666666',
                },
              }}
            >
              START
            </Button>
            <Button
              variant="contained"
              onClick={() => handleEngineControl(selectedEngine, 'stop')}
              disabled={engines[selectedEngine].status === 'stopped'}
              sx={{
                bgcolor: '#ff4444',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: '#cc3333',
                },
                '&:disabled': {
                  bgcolor: '#333333',
                  color: '#666666',
                },
              }}
            >
              STOP
            </Button>
          </Box>

          {/* All Engines Overview */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#00ff41',
                fontFamily: 'monospace',
                mb: 1,
              }}
            >
              ALL ENGINES STATUS
            </Typography>
            <Grid container spacing={1}>
              {engines.map((engine, index) => (
                <Grid item xs={6} key={index}>
                  <Box
                    sx={{
                      bgcolor: '#000000',
                      p: 1,
                      borderRadius: 1,
                      border: `1px solid ${getStatusColor(engine.status)}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: getStatusColor(engine.status),
                        fontFamily: 'monospace',
                        display: 'block',
                        fontWeight: 'bold',
                      }}
                    >
                      ENG {index + 1}: {engine.status.toUpperCase()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        display: 'block',
                        fontSize: '10px',
                      }}
                    >
                      RPM: {Math.round(engine.rpm)} | TEMP: {Math.round(engine.temperature)}°C
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default EngineControlPanel;
