import React from 'react';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    // First navigate to home if not already there
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1300
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00e5ff 30%, #00ff41 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            ⚓ Maritime Intelligence System
          </Typography>

          {location.pathname === '/' && (
            <>
              <Button
                color="inherit"
                onClick={() => scrollToSection('ship-dashboard')}
                sx={{
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                🚢 Voyage Analysis
              </Button>
              <Button
                color="inherit"
                onClick={() => scrollToSection('route-management')}
                sx={{
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                🗺️ Route & Weather
              </Button>
            </>
          )}

          <Button
            color="inherit"
            onClick={() => navigate('/')}
            variant={location.pathname === '/' ? 'outlined' : 'text'}
            sx={{
              mr: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            🏠 Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      {/* Add top spacing for fixed AppBar */}
      <Toolbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          scrollBehavior: 'smooth'
        }}
      >
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          p: 2,
          textAlign: 'center',
          backgroundColor: 'rgba(26, 26, 26, 0.9)',
          color: 'primary.main',
          borderTop: '2px solid rgba(0, 229, 255, 0.6)'
        }}
      >
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          © {new Date().getFullYear()} Maritime Weather Intelligence Dashboard |
          Status: OPERATIONAL | Last Update: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
