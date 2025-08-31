import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface RadarTarget {
  id: string;
  angle: number;
  distance: number;
  type: 'ship' | 'land' | 'buoy' | 'weather' | 'aircraft';
  speed?: number;
  heading?: number;
  name?: string;
}

interface EnhancedRadarProps {
  size?: number;
  range?: number; // in nautical miles
  targets?: RadarTarget[];
  sweepSpeed?: number; // degrees per second
}

const EnhancedRadar: React.FC<EnhancedRadarProps> = ({
  size = 300,
  range = 10,
  targets = [],
  sweepSpeed = 60
}) => {
  const [sweepAngle, setSweepAngle] = useState(0);
  const [animatedTargets, setAnimatedTargets] = useState<RadarTarget[]>(targets);
  const [detectedTargets, setDetectedTargets] = useState<Set<string>>(new Set());

  const centerX = size / 2;
  const centerY = size / 2;
  const radarRadius = size / 2 - 30;

  // Animate radar sweep
  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle(prev => (prev + sweepSpeed / 60) % 360);
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [sweepSpeed]);

  // Animate targets (simulate movement)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedTargets(prev => prev.map(target => ({
        ...target,
        angle: target.type === 'ship' || target.type === 'aircraft' 
          ? (target.angle + (target.speed || 1) * 0.1) % 360
          : target.angle,
        distance: target.type === 'ship' || target.type === 'aircraft'
          ? Math.max(0.1, Math.min(1, target.distance + (Math.random() - 0.5) * 0.01))
          : target.distance
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Detect targets when sweep passes over them
  useEffect(() => {
    const newDetected = new Set(detectedTargets);
    animatedTargets.forEach(target => {
      const angleDiff = Math.abs(sweepAngle - target.angle);
      const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

      if (normalizedDiff < 8) { // 8 degree detection window for better visibility
        newDetected.add(target.id);
      }
    });

    setDetectedTargets(newDetected);

    // Fade out old detections after sweep passes
    const fadeTimeout = setTimeout(() => {
      setDetectedTargets(prev => {
        const filtered = new Set<string>();
        prev.forEach(id => {
          const target = animatedTargets.find(t => t.id === id);
          if (target) {
            const angleDiff = Math.abs(sweepAngle - target.angle);
            const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);
            if (normalizedDiff < 45) { // Keep for 45 degrees after detection
              filtered.add(id);
            }
          }
        });
        return filtered;
      });
    }, 1000);

    return () => clearTimeout(fadeTimeout);
  }, [sweepAngle, animatedTargets, detectedTargets]);

  const getTargetColor = (type: string) => {
    switch (type) {
      case 'ship': return '#ff4444';
      case 'land': return '#44ff44';
      case 'buoy': return '#ffff44';
      case 'weather': return '#ff44ff';
      case 'aircraft': return '#44ffff';
      default: return '#ffffff';
    }
  };

  const getTargetSymbol = (type: string) => {
    switch (type) {
      case 'ship': return '▲';
      case 'land': return '■';
      case 'buoy': return '●';
      case 'weather': return '◆';
      case 'aircraft': return '✈';
      default: return '●';
    }
  };

  // Generate range rings
  const rangeRings = [];
  for (let i = 1; i <= 4; i++) {
    const ringRadius = (radarRadius / 4) * i;
    rangeRings.push(
      <circle
        key={i}
        cx={centerX}
        cy={centerY}
        r={ringRadius}
        fill="none"
        stroke="#78909c"
        strokeWidth="1"
        opacity="0.6"
      />
    );
  }

  // Generate bearing lines
  const bearingLines = [];
  for (let angle = 0; angle < 360; angle += 30) {
    const x = centerX + radarRadius * Math.cos((angle - 90) * Math.PI / 180);
    const y = centerY + radarRadius * Math.sin((angle - 90) * Math.PI / 180);
    bearingLines.push(
      <line
        key={angle}
        x1={centerX}
        y1={centerY}
        x2={x}
        y2={y}
        stroke="#90a4ae"
        strokeWidth="1"
        opacity="0.4"
      />
    );
  }

  return (
    <Paper
      elevation={6}
      sx={{
        p: 3,
        bgcolor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#1976d2',
          textAlign: 'center',
          fontFamily: '"Roboto", sans-serif',
          fontWeight: 600,
          mb: 2,
        }}
      >
        RADAR DISPLAY - {range} NM
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <svg width={size} height={size} style={{ backgroundColor: '#263238', borderRadius: '50%', border: '2px solid #37474f' }}>
          {/* Range rings */}
          {rangeRings}
          
          {/* Bearing lines */}
          {bearingLines}

          {/* Compass markings */}
          {[0, 90, 180, 270].map(angle => {
            const x = centerX + (radarRadius + 15) * Math.cos((angle - 90) * Math.PI / 180);
            const y = centerY + (radarRadius + 15) * Math.sin((angle - 90) * Math.PI / 180);
            const label = angle === 0 ? 'N' : angle === 90 ? 'E' : angle === 180 ? 'S' : 'W';
            return (
              <text
                key={angle}
                x={x}
                y={y}
                fill="#ffffff"
                fontSize="12"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Arial, sans-serif"
                fontWeight="600"
              >
                {label}
              </text>
            );
          })}

          {/* Radar sweep */}
          <defs>
            <radialGradient id="sweepGradient" cx="0%" cy="0%">
              <stop offset="0%" stopColor="#2196f3" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#2196f3" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2196f3" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          <path
            d={`M ${centerX} ${centerY} L ${centerX + radarRadius * Math.cos((sweepAngle - 90) * Math.PI / 180)} ${centerY + radarRadius * Math.sin((sweepAngle - 90) * Math.PI / 180)} A ${radarRadius} ${radarRadius} 0 0 1 ${centerX + radarRadius * Math.cos((sweepAngle - 60 - 90) * Math.PI / 180)} ${centerY + radarRadius * Math.sin((sweepAngle - 60 - 90) * Math.PI / 180)} Z`}
            fill="url(#sweepGradient)"
          />

          {/* Sweep line */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radarRadius * Math.cos((sweepAngle - 90) * Math.PI / 180)}
            y2={centerY + radarRadius * Math.sin((sweepAngle - 90) * Math.PI / 180)}
            stroke="#2196f3"
            strokeWidth="2"
            opacity="0.9"
          />

          {/* Targets */}
          {animatedTargets.map(target => {
            const targetX = centerX + (target.distance * radarRadius) * Math.cos((target.angle - 90) * Math.PI / 180);
            const targetY = centerY + (target.distance * radarRadius) * Math.sin((target.angle - 90) * Math.PI / 180);
            const isDetected = detectedTargets.has(target.id);
            
            return (
              <g key={target.id}>
                {/* Target blip */}
                <circle
                  cx={targetX}
                  cy={targetY}
                  r="3"
                  fill={getTargetColor(target.type)}
                  opacity={isDetected ? 1 : 0.3}
                  filter={isDetected ? `drop-shadow(0 0 3px ${getTargetColor(target.type)})` : 'none'}
                />
                
                {/* Target symbol */}
                <text
                  x={targetX}
                  y={targetY - 8}
                  fill={getTargetColor(target.type)}
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="monospace"
                  opacity={isDetected ? 1 : 0.3}
                >
                  {getTargetSymbol(target.type)}
                </text>

                {/* Target trail */}
                {target.type === 'ship' && isDetected && (
                  <line
                    x1={targetX}
                    y1={targetY}
                    x2={targetX - 10 * Math.cos((target.heading || target.angle) * Math.PI / 180)}
                    y2={targetY - 10 * Math.sin((target.heading || target.angle) * Math.PI / 180)}
                    stroke={getTargetColor(target.type)}
                    strokeWidth="1"
                    opacity="0.6"
                  />
                )}
              </g>
            );
          })}

          {/* Center dot (own ship) */}
          <circle
            cx={centerX}
            cy={centerY}
            r="4"
            fill="#00ff41"
            filter="drop-shadow(0 0 5px #00ff41)"
          />
        </svg>
      </Box>

      {/* Target information */}
      <Box sx={{ maxHeight: '100px', overflowY: 'auto' }}>
        {Array.from(detectedTargets.values()).map(targetId => {
          const target = animatedTargets.find(t => t.id === targetId);
          if (!target) return null;
          
          return (
            <Typography
              key={targetId}
              variant="caption"
              sx={{
                color: '#37474f',
                fontFamily: '"Roboto Mono", monospace',
                display: 'block',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              {target.name || target.type.toUpperCase()}: {(target.distance * range).toFixed(1)}NM @ {Math.round(target.angle)}°
            </Typography>
          );
        })}
      </Box>
    </Paper>
  );
};

export default EnhancedRadar;
