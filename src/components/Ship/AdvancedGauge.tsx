import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdvancedGaugeProps {
  title: string;
  value: number;
  maxValue: number;
  minValue?: number;
  unit: string;
  type: 'speed' | 'temperature' | 'fuel' | 'rpm' | 'pressure' | 'compass';
  size?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  showDigital?: boolean;
}

const AdvancedGauge: React.FC<AdvancedGaugeProps> = ({
  title,
  value,
  maxValue,
  minValue = 0,
  unit,
  type,
  size = 180,
  warningThreshold,
  criticalThreshold,
  showDigital = true
}) => {
  const [animatedValue, setAnimatedValue] = useState(minValue);
  const [isBlinking, setIsBlinking] = useState(false);

  // Smooth animation for value changes
  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 60; // 60fps
    const stepValue = (value - animatedValue) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setAnimatedValue(prev => {
        const newValue = prev + stepValue;
        if (currentStep >= steps) {
          clearInterval(interval);
          return value;
        }
        return newValue;
      });
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, animatedValue]);

  // Blinking effect for critical values
  useEffect(() => {
    if (criticalThreshold && animatedValue >= criticalThreshold) {
      const blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);
      return () => clearInterval(blinkInterval);
    } else {
      setIsBlinking(false);
    }
  }, [animatedValue, criticalThreshold]);

  const getColor = () => {
    if (criticalThreshold && animatedValue >= criticalThreshold) {
      return isBlinking ? '#ff0000' : '#ff4444';
    }
    if (warningThreshold && animatedValue >= warningThreshold) {
      return '#ffaa00';
    }
    switch (type) {
      case 'speed': return '#00ff41';
      case 'temperature': return animatedValue > (maxValue * 0.8) ? '#ff6600' : '#00aaff';
      case 'fuel': return animatedValue < 20 ? '#ff4444' : '#00ff41';
      case 'rpm': return '#00ffff';
      case 'pressure': return '#ffff00';
      case 'compass': return '#ff00ff';
      default: return '#00ff41';
    }
  };

  const percentage = ((animatedValue - minValue) / (maxValue - minValue)) * 100;
  const angle = (percentage / 100) * 270 - 135; // 270 degree arc starting from -135 degrees

  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate needle position
  const needleLength = radius - 10;
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const tickAngle = -135 + (i * 27); // 270 degrees / 10 ticks
    const tickValue = minValue + (i * (maxValue - minValue)) / 10;
    const isMainTick = i % 2 === 0;
    const tickRadius = radius - (isMainTick ? 15 : 10);
    const tickX1 = centerX + tickRadius * Math.cos((tickAngle * Math.PI) / 180);
    const tickY1 = centerY + tickRadius * Math.sin((tickAngle * Math.PI) / 180);
    const tickX2 = centerX + (radius - 5) * Math.cos((tickAngle * Math.PI) / 180);
    const tickY2 = centerY + (radius - 5) * Math.sin((tickAngle * Math.PI) / 180);

    ticks.push(
      <g key={i}>
        <line
          x1={tickX1}
          y1={tickY1}
          x2={tickX2}
          y2={tickY2}
          stroke={getColor()}
          strokeWidth={isMainTick ? 2 : 1}
          opacity={0.8}
        />
        {isMainTick && (
          <text
            x={centerX + (tickRadius - 15) * Math.cos((tickAngle * Math.PI) / 180)}
            y={centerY + (tickRadius - 15) * Math.sin((tickAngle * Math.PI) / 180)}
            fill={getColor()}
            fontSize="10"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="monospace"
          >
            {Math.round(tickValue)}
          </text>
        )}
      </g>
    );
  }

  return (
    <Paper
      elevation={6}
      sx={{
        p: 2,
        bgcolor: '#000811',
        border: `2px solid ${getColor()}`,
        borderRadius: 2,
        boxShadow: `0 0 20px ${getColor()}40`,
        transition: 'all 0.3s ease',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: getColor(),
          textAlign: 'center',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          mb: 1,
          textShadow: `0 0 5px ${getColor()}`,
        }}
      >
        {title}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
        <svg width={size} height={size}>
          {/* Outer ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="2"
            opacity="0.3"
          />
          
          {/* Arc background */}
          <path
            d={`M ${centerX + radius * Math.cos(-135 * Math.PI / 180)} ${centerY + radius * Math.sin(-135 * Math.PI / 180)} A ${radius} ${radius} 0 1 1 ${centerX + radius * Math.cos(135 * Math.PI / 180)} ${centerY + radius * Math.sin(135 * Math.PI / 180)}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="4"
            opacity="0.2"
          />
          
          {/* Value arc */}
          <path
            d={`M ${centerX + radius * Math.cos(-135 * Math.PI / 180)} ${centerY + radius * Math.sin(-135 * Math.PI / 180)} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${centerX + radius * Math.cos(angle * Math.PI / 180)} ${centerY + radius * Math.sin(angle * Math.PI / 180)}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="4"
            opacity="0.8"
            filter={`drop-shadow(0 0 5px ${getColor()})`}
          />

          {/* Tick marks */}
          {ticks}

          {/* Center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="4"
            fill={getColor()}
            filter={`drop-shadow(0 0 3px ${getColor()})`}
          />

          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={getColor()}
            strokeWidth="3"
            strokeLinecap="round"
            filter={`drop-shadow(0 0 3px ${getColor()})`}
          />
        </svg>
      </Box>

      {showDigital && (
        <Box
          sx={{
            bgcolor: '#000000',
            border: `1px solid ${getColor()}`,
            borderRadius: 1,
            p: 1,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: getColor(),
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textShadow: `0 0 5px ${getColor()}`,
            }}
          >
            {animatedValue.toFixed(1)} {unit}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AdvancedGauge;
