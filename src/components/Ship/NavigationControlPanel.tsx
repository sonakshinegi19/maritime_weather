import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Slider, Grid, IconButton } from '@mui/material';
import { 
  KeyboardArrowUp, 
  KeyboardArrowDown, 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  Stop as StopIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';

interface NavigationControlPanelProps {
  currentSpeed?: number;
  currentHeading?: number;
  maxSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  onHeadingChange?: (heading: number) => void;
  onEmergencyStop?: () => void;
  onEngageAutopilot?: (engaged: boolean) => void;
}

const NavigationControlPanel: React.FC<NavigationControlPanelProps> = ({
  currentSpeed = 12.5,
  currentHeading = 45,
  maxSpeed = 25,
  onSpeedChange,
  onHeadingChange,
  onEmergencyStop,
  onEngageAutopilot
}) => {
  const [targetSpeed, setTargetSpeed] = useState(currentSpeed);
  const [targetHeading, setTargetHeading] = useState(currentHeading);
  const [autopilotEngaged, setAutopilotEngaged] = useState(false);
  const [emergencyStopActive, setEmergencyStopActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking effect for emergency stop
  useEffect(() => {
    if (emergencyStopActive) {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 300);
      return () => clearInterval(interval);
    } else {
      setIsBlinking(false);
    }
  }, [emergencyStopActive]);

  const handleSpeedChange = (newSpeed: number) => {
    if (!emergencyStopActive) {
      setTargetSpeed(newSpeed);
      onSpeedChange?.(newSpeed);
    }
  };

  const handleHeadingChange = (newHeading: number) => {
    const normalizedHeading = ((newHeading % 360) + 360) % 360;
    setTargetHeading(normalizedHeading);
    onHeadingChange?.(normalizedHeading);
  };

  const handleEmergencyStop = () => {
    setEmergencyStopActive(true);
    setTargetSpeed(0);
    setAutopilotEngaged(false);
    onSpeedChange?.(0);
    onEmergencyStop?.();
    
    // Auto-clear emergency stop after 10 seconds
    setTimeout(() => {
      setEmergencyStopActive(false);
    }, 10000);
  };

  const toggleAutopilot = () => {
    if (!emergencyStopActive) {
      const newState = !autopilotEngaged;
      setAutopilotEngaged(newState);
      onEngageAutopilot?.(newState);
    }
  };

  const adjustHeading = (delta: number) => {
    if (!emergencyStopActive) {
      handleHeadingChange(targetHeading + delta);
    }
  };

  const getSpeedColor = () => {
    if (emergencyStopActive) return '#ff4444';
    if (targetSpeed === 0) return '#666666';
    if (targetSpeed < maxSpeed * 0.3) return '#00ff41';
    if (targetSpeed < maxSpeed * 0.7) return '#ffff00';
    return '#ff8800';
  };

  const getHeadingColor = () => {
    return autopilotEngaged ? '#00ffff' : '#00ff41';
  };

  return (
    <Paper
      elevation={6}
      sx={{
        p: 2,
        bgcolor: '#000811',
        border: `3px solid ${emergencyStopActive ? '#ff4444' : '#00ff41'}`,
        borderRadius: 2,
        boxShadow: emergencyStopActive 
          ? '0 0 30px #ff444440' 
          : '0 0 20px #00ff4140',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Emergency Stop Indicator */}
      {emergencyStopActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            bgcolor: isBlinking ? '#ff0000' : '#ff4444',
            animation: 'pulse 0.3s infinite',
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
          color: emergencyStopActive ? '#ff4444' : '#00ff41',
          textAlign: 'center',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          mb: 2,
          textShadow: `0 0 10px ${emergencyStopActive ? '#ff4444' : '#00ff41'}`,
        }}
      >
        🧭 NAVIGATION CONTROL 🧭
      </Typography>

      <Grid container spacing={3}>
        {/* Speed Control */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              bgcolor: '#001122',
              p: 2,
              borderRadius: 2,
              border: `2px solid ${getSpeedColor()}`,
              boxShadow: `0 0 10px ${getSpeedColor()}40`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: getSpeedColor(),
                textAlign: 'center',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              ⚡ SPEED CONTROL
            </Typography>

            {/* Digital Speed Display */}
            <Box
              sx={{
                bgcolor: '#000000',
                p: 2,
                borderRadius: 1,
                border: `1px solid ${getSpeedColor()}`,
                mb: 2,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: getSpeedColor(),
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: `0 0 10px ${getSpeedColor()}`,
                }}
              >
                {targetSpeed.toFixed(1)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: getSpeedColor(),
                  fontFamily: 'monospace',
                }}
              >
                KNOTS
              </Typography>
            </Box>

            {/* Speed Slider */}
            <Slider
              value={targetSpeed}
              onChange={(_, value) => handleSpeedChange(value as number)}
              min={0}
              max={maxSpeed}
              step={0.1}
              disabled={emergencyStopActive}
              sx={{
                color: getSpeedColor(),
                mb: 2,
                '& .MuiSlider-thumb': {
                  bgcolor: getSpeedColor(),
                  boxShadow: `0 0 10px ${getSpeedColor()}`,
                },
                '& .MuiSlider-track': {
                  bgcolor: getSpeedColor(),
                  boxShadow: `0 0 5px ${getSpeedColor()}`,
                },
                '& .MuiSlider-rail': {
                  bgcolor: '#003311',
                },
              }}
            />

            {/* Speed Preset Buttons */}
            <Grid container spacing={1}>
              <Grid item xs={3}>
                <Button
                  size="small"
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSpeedChange(0)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: '#666666',
                    borderColor: '#666666',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                  }}
                >
                  STOP
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button
                  size="small"
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSpeedChange(maxSpeed * 0.2)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: '#00ff41',
                    borderColor: '#00ff41',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                  }}
                >
                  SLOW
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button
                  size="small"
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSpeedChange(maxSpeed * 0.6)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: '#ffff00',
                    borderColor: '#ffff00',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                  }}
                >
                  HALF
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button
                  size="small"
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSpeedChange(maxSpeed)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: '#ff8800',
                    borderColor: '#ff8800',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                  }}
                >
                  FULL
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Heading Control */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              bgcolor: '#001122',
              p: 2,
              borderRadius: 2,
              border: `2px solid ${getHeadingColor()}`,
              boxShadow: `0 0 10px ${getHeadingColor()}40`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: getHeadingColor(),
                textAlign: 'center',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              🧭 HEADING CONTROL
            </Typography>

            {/* Digital Heading Display */}
            <Box
              sx={{
                bgcolor: '#000000',
                p: 2,
                borderRadius: 1,
                border: `1px solid ${getHeadingColor()}`,
                mb: 2,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: getHeadingColor(),
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: `0 0 10px ${getHeadingColor()}`,
                }}
              >
                {targetHeading.toFixed(0).padStart(3, '0')}°
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: getHeadingColor(),
                  fontFamily: 'monospace',
                }}
              >
                {autopilotEngaged ? 'AUTOPILOT' : 'MANUAL'}
              </Typography>
            </Box>

            {/* Heading Control Buttons */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => adjustHeading(-1)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: getHeadingColor(),
                    border: `1px solid ${getHeadingColor()}`,
                    '&:hover': { bgcolor: `${getHeadingColor()}20` },
                  }}
                >
                  <KeyboardArrowUp />
                </IconButton>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => adjustHeading(-10)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: getHeadingColor(),
                    border: `1px solid ${getHeadingColor()}`,
                    '&:hover': { bgcolor: `${getHeadingColor()}20` },
                  }}
                >
                  <KeyboardArrowLeft />
                </IconButton>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={toggleAutopilot}
                  disabled={emergencyStopActive}
                  sx={{
                    color: autopilotEngaged ? '#00ffff' : '#666666',
                    borderColor: autopilotEngaged ? '#00ffff' : '#666666',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    minWidth: '60px',
                  }}
                >
                  AUTO
                </Button>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => adjustHeading(10)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: getHeadingColor(),
                    border: `1px solid ${getHeadingColor()}`,
                    '&:hover': { bgcolor: `${getHeadingColor()}20` },
                  }}
                >
                  <KeyboardArrowRight />
                </IconButton>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => adjustHeading(1)}
                  disabled={emergencyStopActive}
                  sx={{
                    color: getHeadingColor(),
                    border: `1px solid ${getHeadingColor()}`,
                    '&:hover': { bgcolor: `${getHeadingColor()}20` },
                  }}
                >
                  <KeyboardArrowDown />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Emergency Stop Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleEmergencyStop}
            disabled={emergencyStopActive}
            sx={{
              bgcolor: emergencyStopActive ? '#666666' : '#ff0000',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '18px',
              py: 2,
              border: '3px solid #ffffff',
              boxShadow: emergencyStopActive 
                ? 'none' 
                : '0 0 20px #ff000040',
              '&:hover': {
                bgcolor: emergencyStopActive ? '#666666' : '#cc0000',
              },
              opacity: isBlinking ? 0.7 : 1,
            }}
          >
            {emergencyStopActive ? (
              <>🛑 EMERGENCY STOP ACTIVE 🛑</>
            ) : (
              <>🛑 EMERGENCY STOP 🛑</>
            )}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default NavigationControlPanel;
