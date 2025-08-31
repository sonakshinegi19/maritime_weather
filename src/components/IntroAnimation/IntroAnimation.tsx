import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';

const waveAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const shipMovement = keyframes`
  0% { 
    transform: translateX(-200px) translateY(0px) scale(0.7); 
    opacity: 0;
  }
  15% { 
    opacity: 1;
    transform: translateX(-120px) translateY(-8px) scale(0.85);
  }
  50% {
    transform: translateX(150px) translateY(-12px) scale(1);
    opacity: 1;
  }
  85% { 
    transform: translateX(400px) translateY(-18px) scale(1.15); 
    opacity: 0.8;
  }
  100% { 
    transform: translateX(500px) translateY(-22px) scale(1.3); 
    opacity: 0;
  }
`;

const textFadeIn = keyframes`
  0% { 
    opacity: 0; 
    transform: translateY(50px) scale(0.8);
  }
  50% { 
    opacity: 0; 
    transform: translateY(30px) scale(0.9);
  }
  100% { 
    opacity: 1; 
    transform: translateY(0px) scale(1);
  }
`;

const waveMovement = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const AnimationContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(to bottom, #87CEEB 0%, #4682B4 40%, #2E86AB 70%, #1e3a8a 100%)',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
});

const SeaContainer = styled(Box)({
  position: 'absolute',
  bottom: 0,
  width: '100%',
  height: '60%',
  background: 'linear-gradient(to bottom, #2E86AB 0%, #1e3a8a 50%, #0f2557 100%)',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '20px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
    animation: `${waveMovement} 4s infinite linear`,
  },
});

const Wave = styled(Box)<{ delay?: number }>(({ delay = 0 }) => ({
  position: 'absolute',
  bottom: 0,
  width: '200%',
  height: '100px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  animation: `${waveMovement} ${3 + delay}s infinite linear`,
  animationDelay: `${delay}s`,
}));

const ShipContainer = styled(Box)({
  position: 'absolute',
  bottom: '30%',
  left: '50%',
  transform: 'translateX(-50%)',
  animation: `${shipMovement} 4s ease-in-out forwards`,
  animationDelay: '1s',
});

const Ship = styled('div')({  
  width: '180px',
  height: '90px',
  position: 'relative',
  backgroundImage: 'url("https://media.istockphoto.com/id/153592157/photo/cruise-ship.jpg?s=612x612&w=0&k=20&c=WZf14G3mUjDTPNxqOl9U0Ih4IIaGep0qsXgANzWmxf4=")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '12px',
  filter: 'drop-shadow(6px 6px 16px rgba(0,0,0,0.5)) brightness(1.1) contrast(1.1)',
  border: '3px solid rgba(255,255,255,0.3)',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.15) 100%)',
    borderRadius: '12px',
    animation: `${waveMovement} 3s infinite ease-in-out`,
  },
});

const TextContainer = styled(Box)({
  position: 'absolute',
  top: '35%',
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  animation: `${textFadeIn} 2s ease-out forwards`,
  animationDelay: '0.5s',
  opacity: 0,
});

const TechnoNitiText = styled(Typography)({
  fontSize: '4.5rem',
  fontWeight: 700,
  color: '#ffffff',
  textShadow: '3px 3px 12px rgba(0,0,0,0.6)',
  letterSpacing: '0.15em',
  fontFamily: '"Roboto", "Arial", sans-serif',
  marginBottom: '0.5rem',
  background: 'linear-gradient(45deg, #ffffff 30%, #f8f9fa 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

const SubText = styled(Typography)({
  fontSize: '1.4rem',
  color: 'rgba(255,255,255,0.95)',
  textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
  letterSpacing: '0.08em',
  marginBottom: '0.8rem',
  fontWeight: 300,
});

const TaglineText = styled(Typography)({
  fontSize: '1rem',
  color: 'rgba(255,255,255,0.85)',
  textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
  letterSpacing: '0.05em',
  fontStyle: 'italic',
  fontWeight: 300,
});

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 500); // Allow fade out transition
    }, 6000); // Total animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimationContainer>
      {/* Sea Background with Waves */}
      <SeaContainer>
        <Wave delay={0} />
        <Wave delay={1} />
        <Wave delay={2} />
      </SeaContainer>

      {/* Company Text */}
      <TextContainer>
        <TechnoNitiText variant="h1">
          TechNiti
        </TechnoNitiText>
        <SubText>
          Maritime Weather Dashboard
        </SubText>
        <TaglineText>
          Advanced Navigation • Weather Intelligence • Route Optimization
        </TaglineText>
      </TextContainer>

      {/* Animated Ship */}
      <ShipContainer>
        <Ship />
      </ShipContainer>

      {/* Subtle clouds */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          fontSize: '2rem',
          opacity: 0.3,
          animation: `${waveMovement} 8s infinite linear`,
        }}
      >
        ☁️
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '20%',
          fontSize: '1.5rem',
          opacity: 0.2,
          animation: `${waveMovement} 12s infinite linear reverse`,
        }}
      >
        ☁️
      </Box>
    </AnimationContainer>
  );
};

export default IntroAnimation;