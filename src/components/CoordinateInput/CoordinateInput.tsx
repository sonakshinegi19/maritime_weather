import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { parseCoordinates, Position } from '../../services/geocoding';

interface CoordinateInputProps {
  label: string;
  onCoordinateSubmit: (position: Position) => void;
  placeholder?: string;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({
  label,
  onCoordinateSubmit,
  placeholder = '18.9449° N latitude and 72.8441° E longitude'
}) => {
  const [coordinateString, setCoordinateString] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    const position = parseCoordinates(coordinateString);
    
    if (position) {
      onCoordinateSubmit(position);
      setCoordinateString(''); // Clear the input after successful submission
    } else {
      setError('Invalid coordinate format. Please use format like: 18.9449° N latitude and 72.8441° E longitude');
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          value={coordinateString}
          onChange={(e) => setCoordinateString(e.target.value)}
          placeholder={placeholder}
          helperText="Format: 18.9449° N latitude and 72.8441° E longitude"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!coordinateString}
        >
          Submit
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CoordinateInput;