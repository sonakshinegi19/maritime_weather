import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './styles/leaflet.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Layout from './components/common/Layout';
import { ErrorBoundary } from './components/common/ErrorHandling';
import IntroAnimation from './components/IntroAnimation';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff',
      light: '#4fc3f7',
      dark: '#0097a7',
      contrastText: '#000000',
    },
    secondary: {
      main: '#00ff41',
      light: '#4caf50',
      dark: '#00c853',
      contrastText: '#000000',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
    divider: '#37474f',
    error: {
      main: '#ff4444',
      light: '#ff6b6b',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ffb74d',
      light: '#ffcc02',
      dark: '#f57c00',
    },
    info: {
      main: '#29b6f6',
      light: '#4fc3f7',
      dark: '#0277bd',
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: '#b0bec5',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          border: '1px solid #37474f',
          color: '#ffffff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          border: '1px solid #37474f',
          color: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        contained: {
          boxShadow: '0 4px 8px rgba(0, 229, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 229, 255, 0.5)',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 229, 255, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.3)',
            },
          },
        },
      },
    },
  },
});

const queryClient = new QueryClient();

function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <IntroAnimation onComplete={handleIntroComplete} />
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </Layout>
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
