import React from 'react';
import { Alert, Snackbar, CircularProgress, Box, Typography } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
    <CircularProgress />
    <Typography variant="body2" sx={{ mt: 2 }}>
      {message}
    </Typography>
  </Box>
);

export const ErrorAlert: React.FC<{ 
  error: string; 
  onClose: () => void;
  severity?: 'error' | 'warning' | 'info';
}> = ({ error, onClose, severity = 'error' }) => (
  <Snackbar open={!!error} autoHideDuration={6000} onClose={onClose}>
    <Alert onClose={onClose} severity={severity}>
      {error}
    </Alert>
  </Snackbar>
);