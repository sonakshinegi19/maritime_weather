import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

interface SystemStatus {
  id: string;
  name: string;
  status: 'operational' | 'warning' | 'critical' | 'offline';
  value?: number;
  unit?: string;
  lastUpdate?: Date;
}

interface DigitalStatusPanelProps {
  systems: SystemStatus[];
  vesselInfo?: {
    name: string;
    id: string;
    position: { lat: number; lng: number };
    heading: number;
    speed: number;
  };
}

const DigitalStatusPanel: React.FC<DigitalStatusPanelProps> = ({
  systems,
  vesselInfo = {
    name: 'MV MARITIME EXPLORER',
    id: 'IMO-9876543',
    position: { lat: 19.0760, lng: 72.8777 },
    heading: 45,
    speed: 12.5
  }
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollingMessage, setScrollingMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [blinkingItems, setBlinkingItems] = useState<Set<string>>(new Set());

  const messages = [
    'ALL SYSTEMS OPERATIONAL',
    'WEATHER CONDITIONS: FAVORABLE',
    'NEXT PORT: MUMBAI - ETA 14:30 UTC',
    'FUEL CONSUMPTION: OPTIMAL',
    'NAVIGATION STATUS: ON COURSE',
    'COMMUNICATION SYSTEMS: ACTIVE'
  ];

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scrolling message effect
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    setScrollingMessage(messages[messageIndex]);
  }, [messageIndex, messages]);

  // Blinking effect for critical/warning systems
  useEffect(() => {
    const criticalSystems = systems.filter(s => s.status === 'critical' || s.status === 'warning');
    
    if (criticalSystems.length > 0) {
      const interval = setInterval(() => {
        setBlinkingItems(prev => {
          const newSet = new Set(prev);
          criticalSystems.forEach(system => {
            if (newSet.has(system.id)) {
              newSet.delete(system.id);
            } else {
              newSet.add(system.id);
            }
          });
          return newSet;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [systems]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#00ff41';
      case 'warning': return '#ffaa00';
      case 'critical': return '#ff4444';
      case 'offline': return '#666666';
      default: return '#ffffff';
    }
  };

  const getStatusSymbol = (status: string) => {
    switch (status) {
      case 'operational': return '●';
      case 'warning': return '▲';
      case 'critical': return '■';
      case 'offline': return '○';
      default: return '?';
    }
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const abs = Math.abs(coord);
    const degrees = Math.floor(abs);
    const minutes = ((abs - degrees) * 60).toFixed(3);
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${direction}`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        bgcolor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        minHeight: '400px',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#f5f5f5',
          p: 2,
          mb: 2,
          borderRadius: 1,
          border: '1px solid #e0e0e0',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#1976d2',
            textAlign: 'center',
            fontFamily: '"Roboto", sans-serif',
            fontWeight: 600,
          }}
        >
          VESSEL MANAGEMENT SYSTEM
        </Typography>
      </Box>

      {/* Vessel Information */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Box sx={{ bgcolor: '#000000', p: 1, borderRadius: 1, border: '1px solid #00ff41' }}>
            <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'monospace' }}>
              VESSEL NAME
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {vesselInfo.name}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ bgcolor: '#000000', p: 1, borderRadius: 1, border: '1px solid #00ff41' }}>
            <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'monospace' }}>
              IMO NUMBER
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {vesselInfo.id}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Navigation Data */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <Box sx={{ bgcolor: '#000000', p: 1, borderRadius: 1, border: '1px solid #00ffff' }}>
            <Typography variant="caption" sx={{ color: '#00ffff', fontFamily: 'monospace', fontSize: '10px' }}>
              POSITION
            </Typography>
            <Typography variant="caption" sx={{ color: '#ffffff', fontFamily: 'monospace', display: 'block', fontSize: '9px' }}>
              {formatCoordinate(vesselInfo.position.lat, 'lat')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#ffffff', fontFamily: 'monospace', display: 'block', fontSize: '9px' }}>
              {formatCoordinate(vesselInfo.position.lng, 'lng')}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ bgcolor: '#000000', p: 1, borderRadius: 1, border: '1px solid #ffff00' }}>
            <Typography variant="caption" sx={{ color: '#ffff00', fontFamily: 'monospace', fontSize: '10px' }}>
              HEADING
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {vesselInfo.heading.toString().padStart(3, '0')}°
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ bgcolor: '#000000', p: 1, borderRadius: 1, border: '1px solid #ff00ff' }}>
            <Typography variant="caption" sx={{ color: '#ff00ff', fontFamily: 'monospace', fontSize: '10px' }}>
              SPEED
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {vesselInfo.speed.toFixed(1)} KT
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ bgcolor: '#000000', p: 1, borderRadius: 1, border: '1px solid #00ff41' }}>
            <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '10px' }}>
              UTC TIME
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {currentTime.toISOString().substr(11, 8)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* System Status */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: '#00ff41',
            fontFamily: 'monospace',
            mb: 1,
            textShadow: '0 0 3px #00ff41',
          }}
        >
          SYSTEM STATUS
        </Typography>
        <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
          {systems.map(system => (
            <Box
              key={system.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 0.5,
                mb: 0.5,
                bgcolor: blinkingItems.has(system.id) ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                borderRadius: 0.5,
                transition: 'background-color 0.3s ease',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Typography
                  sx={{
                    color: getStatusColor(system.status),
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    mr: 1,
                    opacity: blinkingItems.has(system.id) ? 0.5 : 1,
                  }}
                >
                  {getStatusSymbol(system.status)}
                </Typography>
                <Typography
                  sx={{
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    flex: 1,
                  }}
                >
                  {system.name}
                </Typography>
              </Box>
              {system.value !== undefined && (
                <Typography
                  sx={{
                    color: getStatusColor(system.status),
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  {system.value.toFixed(1)}{system.unit}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Scrolling Message Bar */}
      <Box
        sx={{
          bgcolor: '#001122',
          p: 1,
          borderRadius: 1,
          border: '1px solid #00ff41',
          overflow: 'hidden',
        }}
      >
        <Typography
          sx={{
            color: '#00ff41',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.7 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.7 },
            },
          }}
        >
          {scrollingMessage}
        </Typography>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: '#666666',
            fontFamily: 'monospace',
            fontSize: '10px',
          }}
        >
          LAST UPDATE: {currentTime.toLocaleTimeString()} | STATUS: OPERATIONAL
        </Typography>
      </Box>
    </Paper>
  );
};

export default DigitalStatusPanel;
