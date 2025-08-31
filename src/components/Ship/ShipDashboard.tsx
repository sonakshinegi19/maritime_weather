import React from 'react';
import { Box } from '@mui/material';
import VoyageOptimizationDashboard from '../Voyage/VoyageOptimizationDashboard';

interface ShipDashboardProps {
  selectedRoute?: any;
  weatherLocations?: any[];
  onWindDataChange?: (windData: any[], showWindLayer: boolean) => void;
  onExcelDataChange?: (excelData: any[]) => void;
  onAlternativeRouteSelect?: (altRoute: any) => void;
}

const ShipDashboard: React.FC<ShipDashboardProps> = ({ 
  selectedRoute, 
  weatherLocations, 
  onWindDataChange,
  onExcelDataChange,
  onAlternativeRouteSelect 
}) => {
  return (
    <Box>
      <VoyageOptimizationDashboard
        selectedRoute={selectedRoute}
        weatherLocations={weatherLocations}
        onWindDataChange={onWindDataChange}
        onExcelDataChange={onExcelDataChange}
        onAlternativeRouteSelect={onAlternativeRouteSelect}
      />
    </Box>
  );
};

export default ShipDashboard;
