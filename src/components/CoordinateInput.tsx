import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Position, parseCoordinates } from '../services/geocoding';

interface CoordinateInputProps {
  label: string;
  onCoordinateSubmit: (position: Position) => void;
  initialValue?: Position | null;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({ 
  label, 
  onCoordinateSubmit,
  initialValue = null
}) => {
  const [coordinateText, setCoordinateText] = useState<string>(
    initialValue ? `${initialValue.lat}° ${initialValue.lat >= 0 ? 'N' : 'S'} latitude and ${initialValue.lng}° ${initialValue.lng >= 0 ? 'E' : 'W'} longitude` : ''
  );
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    try {
      const position = parseCoordinates(coordinateText);
      onCoordinateSubmit(position);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid coordinate format. Please use format like "18.9449° N latitude and 72.8441° E longitude"';
      setError(errorMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1">{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          value={coordinateText}
          onChange={(e) => setCoordinateText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g. 18.9449° N latitude and 72.8441° E longitude"
          error={!!error}
          helperText={error}
          size="small"
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          size="small"
        >
          Set
        </Button>
      </Box>
    </Box>
  );
};

export default CoordinateInput;