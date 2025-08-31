import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Grid, Alert } from '@mui/material';
import { Warning as WarningIcon, LocalFireDepartment as FireIcon, Security as SecurityIcon } from '@mui/icons-material';

interface EmergencyStatus {
  id: string;
  type: 'fire' | 'flood' | 'collision' | 'medical' | 'security' | 'abandon_ship';
  active: boolean;
  location?: string;
  timestamp?: Date;
}

interface EmergencyControlPanelProps {
  onEmergencyActivated?: (type: string) => void;
  onEmergencyCleared?: (id: string) => void;
}

const EmergencyControlPanel: React.FC<EmergencyControlPanelProps> = ({
  onEmergencyActivated,
  onEmergencyCleared
}) => {
  const [emergencies, setEmergencies] = useState<EmergencyStatus[]>([]);
  const [generalAlarm, setGeneralAlarm] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking effect for active emergencies
  useEffect(() => {
    if (emergencies.some(e => e.active)) {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setIsBlinking(false);
    }
  }, [emergencies]);

  const activateEmergency = (type: EmergencyStatus['type'], location?: string) => {
    const newEmergency: EmergencyStatus = {
      id: `${type}_${Date.now()}`,
      type,
      active: true,
      location,
      timestamp: new Date()
    };
    
    setEmergencies(prev => [...prev, newEmergency]);
    onEmergencyActivated?.(type);
    
    // Auto-activate general alarm for critical emergencies
    if (['fire', 'flood', 'collision', 'abandon_ship'].includes(type)) {
      setGeneralAlarm(true);
    }
  };

  const clearEmergency = (id: string) => {
    setEmergencies(prev => prev.filter(e => e.id !== id));
    onEmergencyCleared?.(id);
    
    // Clear general alarm if no critical emergencies remain
    const remainingCritical = emergencies.filter(e => 
      e.id !== id && ['fire', 'flood', 'collision', 'abandon_ship'].includes(e.type)
    );
    if (remainingCritical.length === 0) {
      setGeneralAlarm(false);
    }
  };

  const clearAllEmergencies = () => {
    emergencies.forEach(e => onEmergencyCleared?.(e.id));
    setEmergencies([]);
    setGeneralAlarm(false);
  };

  const getEmergencyColor = (type: string) => {
    switch (type) {
      case 'fire': return '#ff4444';
      case 'flood': return '#4444ff';
      case 'collision': return '#ff8800';
      case 'medical': return '#ff44ff';
      case 'security': return '#ffff44';
      case 'abandon_ship': return '#ff0000';
      default: return '#ff4444';
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'flood': return '🌊';
      case 'collision': return '💥';
      case 'medical': return '🏥';
      case 'security': return '🚨';
      case 'abandon_ship': return '🚢';
      default: return '⚠️';
    }
  };

  const activeEmergencies = emergencies.filter(e => e.active);

  return (
    <Paper
      elevation={6}
      sx={{
        p: 2,
        bgcolor: '#000811',
        border: `3px solid ${activeEmergencies.length > 0 ? '#ff4444' : '#666666'}`,
        borderRadius: 2,
        boxShadow: activeEmergencies.length > 0 ? '0 0 30px #ff444440' : '0 0 10px #66666640',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* General Alarm Indicator */}
      {generalAlarm && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            bgcolor: isBlinking ? '#ff0000' : '#ff4444',
            animation: 'pulse 0.5s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.5 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.5 },
            },
          }}
        />
      )}

      <Typography
        variant="h6"
        sx={{
          color: activeEmergencies.length > 0 ? '#ff4444' : '#666666',
          textAlign: 'center',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          mb: 2,
          textShadow: activeEmergencies.length > 0 ? '0 0 10px #ff4444' : 'none',
          opacity: isBlinking && activeEmergencies.length > 0 ? 0.7 : 1,
        }}
      >
        🚨 EMERGENCY CONTROL PANEL 🚨
      </Typography>

      {/* General Alarm Status */}
      {generalAlarm && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            bgcolor: isBlinking ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 68, 68, 0.1)',
            color: '#ff4444',
            border: '1px solid #ff4444',
            '& .MuiAlert-icon': {
              color: '#ff4444',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            ⚠️ GENERAL ALARM ACTIVATED ⚠️
          </Typography>
        </Alert>
      )}

      {/* Emergency Buttons */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => activateEmergency('fire', 'Engine Room')}
            sx={{
              bgcolor: '#ff4444',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#cc3333' },
              py: 1.5,
            }}
          >
            🔥 FIRE ALARM
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => activateEmergency('flood', 'Lower Deck')}
            sx={{
              bgcolor: '#4444ff',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#3333cc' },
              py: 1.5,
            }}
          >
            🌊 FLOOD ALARM
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => activateEmergency('collision', 'Port Side')}
            sx={{
              bgcolor: '#ff8800',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#cc6600' },
              py: 1.5,
            }}
          >
            💥 COLLISION
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => activateEmergency('medical', 'Bridge')}
            sx={{
              bgcolor: '#ff44ff',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#cc33cc' },
              py: 1.5,
            }}
          >
            🏥 MEDICAL
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => activateEmergency('abandon_ship')}
            sx={{
              bgcolor: '#ff0000',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '16px',
              '&:hover': { bgcolor: '#cc0000' },
              py: 2,
              border: '2px solid #ffffff',
            }}
          >
            🚢 ABANDON SHIP
          </Button>
        </Grid>
      </Grid>

      {/* Active Emergencies */}
      {activeEmergencies.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: '#ff4444',
              fontFamily: 'monospace',
              mb: 1,
              textShadow: '0 0 5px #ff4444',
            }}
          >
            ACTIVE EMERGENCIES:
          </Typography>
          {activeEmergencies.map(emergency => (
            <Box
              key={emergency.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                mb: 1,
                bgcolor: isBlinking ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 68, 68, 0.1)',
                border: `1px solid ${getEmergencyColor(emergency.type)}`,
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: getEmergencyColor(emergency.type),
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {getEmergencyIcon(emergency.type)} {emergency.type.toUpperCase().replace('_', ' ')}
                  {emergency.location && ` - ${emergency.location}`}
                </Typography>
                <Typography
                  sx={{
                    color: '#cccccc',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                  }}
                >
                  {emergency.timestamp?.toLocaleTimeString()}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => clearEmergency(emergency.id)}
                sx={{
                  color: '#ffffff',
                  bgcolor: '#666666',
                  minWidth: '60px',
                  '&:hover': { bgcolor: '#888888' },
                }}
              >
                CLEAR
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {/* Clear All Button */}
      {activeEmergencies.length > 0 && (
        <Button
          variant="outlined"
          fullWidth
          onClick={clearAllEmergencies}
          sx={{
            color: '#ffffff',
            borderColor: '#666666',
            fontFamily: 'monospace',
            '&:hover': {
              borderColor: '#888888',
              bgcolor: 'rgba(136, 136, 136, 0.1)',
            },
          }}
        >
          CLEAR ALL EMERGENCIES
        </Button>
      )}
    </Paper>
  );
};

export default EmergencyControlPanel;
