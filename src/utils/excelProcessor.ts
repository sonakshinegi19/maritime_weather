// Excel Processing Utility for ECMWF Wind Data
// This utility reads real Excel files with wind data
import * as XLSX from 'xlsx';

export interface ExcelWindData {
  lat: number;
  lng: number;
  ecmwf_wind_speed: number;
  ecmwf_wind_dir: number;
  ecmwf_current_speed?: number;
  ecmwf_current_direction?: number;
  ecmwf_swell_direction?: number;
  ecmwf_wave_height?: number;
  V_ship?: number; // Ship base speed (knots)
  D?: number; // Distance to destination (nautical miles)
  location?: string;
  timestamp?: string;
  leg?: number;
  [key: string]: any; // Allow additional columns from Excel
}

export interface ProcessedWindData {
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  location: string;
  currentSpeed?: number;
  currentDirection?: number;
  swellDirection?: number;
  waveHeight?: number;
  shipSpeed?: number;
  distanceToDestination?: number;
  eta?: number; // Calculated ETA in hours
}

// Process a real Excel file with ECMWF wind data
export const processExcelWindData = (file: File): Promise<{
  excelData: ExcelWindData[];
  windData: ProcessedWindData[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty');
        }

        // Get headers from first row
        const headers = jsonData[0] as string[];
        console.log('Excel headers found:', headers);

        // Find required columns
        const latIndex = findColumnIndex(headers, ['lat', 'latitude', 'Lat', 'Latitude', 'LAT']);
        const lngIndex = findColumnIndex(headers, ['lng', 'lon', 'longitude', 'Lng', 'Lon', 'Longitude', 'LNG', 'LON']);
        const windSpeedIndex = findColumnIndex(headers, ['ecmwf_wind_speed', 'wind_speed', 'windspeed', 'Wind Speed', 'ECMWF Wind Speed']);
        const windDirIndex = findColumnIndex(headers, ['ecmwf_wind_dir', 'wind_dir', 'wind_direction', 'winddir', 'Wind Direction', 'ECMWF Wind Direction']);

        // Find optional columns for ETA calculation
        const currentSpeedIndex = findColumnIndex(headers, ['ecmwf_current_speed', 'current_speed', 'Current Speed', 'ECMWF Current Speed']);
        const currentDirIndex = findColumnIndex(headers, ['ecmwf_current_direction', 'current_direction', 'Current Direction', 'ECMWF Current Direction']);
        const swellDirIndex = findColumnIndex(headers, ['ecmwf_swell_direction', 'swell_direction', 'Swell Direction', 'ECMWF Swell Direction']);
        const waveHeightIndex = findColumnIndex(headers, ['ecmwf_wave_height', 'wave_height', 'Wave Height', 'ECMWF Wave Height']);
        const shipSpeedIndex = findColumnIndex(headers, ['V_ship', 'ship_speed', 'Ship Speed', 'Base Speed']);
        const distanceIndex = findColumnIndex(headers, ['D', 'distance', 'Distance', 'Distance to Destination']);

        if (latIndex === -1 || lngIndex === -1) {
          throw new Error('Could not find latitude/longitude columns. Please ensure your Excel file has columns named: lat/latitude and lng/lon/longitude');
        }

        if (windSpeedIndex === -1 || windDirIndex === -1) {
          throw new Error('Could not find wind data columns. Please ensure your Excel file has columns named: ecmwf_wind_speed and ecmwf_wind_dir (or similar)');
        }

        const excelData: ExcelWindData[] = [];
        const windData: ProcessedWindData[] = [];

        // Process data rows (skip header row)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];

          // Skip empty rows
          if (!row || row.length === 0) continue;

          const lat = parseFloat(row[latIndex]);
          const lng = parseFloat(row[lngIndex]);
          const windSpeed = parseFloat(row[windSpeedIndex]);
          const windDir = parseFloat(row[windDirIndex]);

          // Validate required data
          if (isNaN(lat) || isNaN(lng) || isNaN(windSpeed) || isNaN(windDir)) {
            console.warn(`Skipping row ${i + 1}: Invalid required data - lat: ${lat}, lng: ${lng}, windSpeed: ${windSpeed}, windDir: ${windDir}`);
            continue;
          }

          // Parse optional data for ETA calculation
          const currentSpeed = currentSpeedIndex !== -1 ? parseFloat(row[currentSpeedIndex]) || 0 : 0;
          const currentDirection = currentDirIndex !== -1 ? parseFloat(row[currentDirIndex]) || 0 : 0;
          const swellDirection = swellDirIndex !== -1 ? parseFloat(row[swellDirIndex]) || 0 : 0;
          const waveHeight = waveHeightIndex !== -1 ? parseFloat(row[waveHeightIndex]) || 0 : 0;
          const shipSpeed = shipSpeedIndex !== -1 ? parseFloat(row[shipSpeedIndex]) || 12 : 12; // Default 12 knots
          const distance = distanceIndex !== -1 ? parseFloat(row[distanceIndex]) || 100 : 100; // Default 100 nm

          // Calculate ETA using the provided formula
          let eta = 0;
          try {
            eta = calculateETA(
              shipSpeed,
              windSpeed,
              currentSpeed,
              currentDirection,
              swellDirection,
              waveHeight,
              distance
            );
          } catch (error) {
            console.warn(`Error calculating ETA for row ${i + 1}:`, error);
            eta = distance / shipSpeed; // Fallback to simple calculation
          }

          // Create data point with all available data
          const dataPoint: ExcelWindData = {
            lat,
            lng,
            ecmwf_wind_speed: windSpeed,
            ecmwf_wind_dir: windDir,
            ecmwf_current_speed: currentSpeed,
            ecmwf_current_direction: currentDirection,
            ecmwf_swell_direction: swellDirection,
            ecmwf_wave_height: waveHeight,
            V_ship: shipSpeed,
            D: distance,
            location: `Point ${i}`,
            leg: i
          };

          // Add any additional columns
          headers.forEach((header, index) => {
            if (index !== latIndex && index !== lngIndex && index !== windSpeedIndex && index !== windDirIndex &&
                index !== currentSpeedIndex && index !== currentDirIndex && index !== swellDirIndex &&
                index !== waveHeightIndex && index !== shipSpeedIndex && index !== distanceIndex) {
              dataPoint[header] = row[index];
            }
          });

          const windPoint: ProcessedWindData = {
            lat,
            lng,
            speed: windSpeed,
            direction: windDir,
            location: dataPoint.location || `Point ${i}`,
            currentSpeed,
            currentDirection,
            swellDirection,
            waveHeight,
            shipSpeed,
            distanceToDestination: distance,
            eta
          };

          excelData.push(dataPoint);
          windData.push(windPoint);
        }

        if (excelData.length === 0) {
          throw new Error('No valid data rows found in Excel file');
        }

        console.log(`Successfully processed Excel file: ${excelData.length} wind measurement points`);
        console.log('Sample data point:', excelData[0]);

        resolve({
          excelData,
          windData
        });

      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Helper function to find column index by multiple possible names
const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(header =>
      header && header.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (index !== -1) return index;
  }
  return -1;
};

// ETA Calculation Function based on your formula
const calculateETA = (
  shipSpeed: number, // V_ship (knots)
  windSpeed: number, // ecmwf_wind_speed (knots)
  currentSpeed: number, // ecmwf_current_speed
  currentDirection: number, // ecmwf_current_direction (degrees)
  swellDirection: number, // ecmwf_swell_direction (degrees)
  waveHeight: number, // ecmwf_wave_height (meters)
  distance: number, // D (nautical miles)
  shipHeading: number = 0 // Ship heading (degrees from North), default 0
): number => {
  // Constants for the formula (can be adjusted based on vessel type)
  const k1 = 1.0; // Current effect coefficient
  const k2 = 0.1; // Wind effect coefficient
  const k3 = 0.5; // Wave effect coefficient

  // Convert degrees to radians for trigonometric calculations
  const toRadians = (degrees: number) => degrees * Math.PI / 180;

  // Calculate angles between ship heading and environmental factors
  const θ_current = toRadians(Math.abs(shipHeading - currentDirection));
  const θ_swell = toRadians(Math.abs(shipHeading - swellDirection));

  // Effective current speed along ship heading
  const V_current_eff = currentSpeed * Math.cos(θ_current);

  // Wave effect along ship heading
  const V_wave_effect = k3 * waveHeight * (1 + Math.cos(θ_swell));

  // Final ETA calculation
  const effectiveSpeed = shipSpeed + k1 * V_current_eff - k2 * windSpeed - V_wave_effect;

  // Ensure we don't divide by zero or negative speed
  if (effectiveSpeed <= 0) {
    console.warn('Effective speed is zero or negative, using minimum speed of 1 knot');
    return distance / 1; // Use 1 knot as minimum
  }

  const eta = distance / effectiveSpeed;

  return eta;
};

// Fallback function to create sample data if Excel reading fails
export const createSampleWindData = (): {
  excelData: ExcelWindData[];
  windData: ProcessedWindData[];
} => {
  const sampleCoordinates = [
    { lat: 19.2667, lng: 84.9000, name: 'Gopalpur Port' },
    { lat: 19.4100, lng: 85.2200, name: 'Coastal Waypoint 1' },
    { lat: 19.6800, lng: 85.6200, name: 'Open Sea Entry' },
    { lat: 20.0200, lng: 86.0800, name: 'Deep Water Point' },
    { lat: 20.4200, lng: 86.5800, name: 'Navigation Point' },
    { lat: 20.8800, lng: 87.1200, name: 'Approach Zone' },
    { lat: 21.3800, lng: 87.6900, name: 'Harbor Approach' },
    { lat: 21.9200, lng: 88.2700, name: 'Harbor Entry' },
    { lat: 22.5700, lng: 88.9200, name: 'Final Harbor' }
  ];

  const excelData: ExcelWindData[] = [];
  const windData: ProcessedWindData[] = [];

  sampleCoordinates.forEach((coord, index) => {
    const windSpeed = 15 + Math.random() * 20; // 15-35 knots
    const windDir = 240 + Math.random() * 80; // 240-320 degrees
    const currentSpeed = 1 + Math.random() * 3; // 1-4 knots
    const currentDir = Math.random() * 360; // 0-360 degrees
    const swellDir = windDir + (Math.random() - 0.5) * 60; // Similar to wind direction
    const waveHeight = 1 + Math.random() * 3; // 1-4 meters
    const shipSpeed = 12 + Math.random() * 6; // 12-18 knots
    const distance = 50 + Math.random() * 100; // 50-150 nautical miles

    // Calculate ETA
    const eta = calculateETA(shipSpeed, windSpeed, currentSpeed, currentDir, swellDir, waveHeight, distance);

    const dataPoint: ExcelWindData = {
      lat: coord.lat,
      lng: coord.lng,
      ecmwf_wind_speed: parseFloat(windSpeed.toFixed(1)),
      ecmwf_wind_dir: parseFloat(windDir.toFixed(0)),
      ecmwf_current_speed: parseFloat(currentSpeed.toFixed(1)),
      ecmwf_current_direction: parseFloat(currentDir.toFixed(0)),
      ecmwf_swell_direction: parseFloat(swellDir.toFixed(0)),
      ecmwf_wave_height: parseFloat(waveHeight.toFixed(1)),
      V_ship: parseFloat(shipSpeed.toFixed(1)),
      D: parseFloat(distance.toFixed(1)),
      location: coord.name,
      leg: index + 1
    };

    const windPoint: ProcessedWindData = {
      lat: coord.lat,
      lng: coord.lng,
      speed: dataPoint.ecmwf_wind_speed,
      direction: dataPoint.ecmwf_wind_dir,
      location: coord.name,
      currentSpeed: dataPoint.ecmwf_current_speed,
      currentDirection: dataPoint.ecmwf_current_direction,
      swellDirection: dataPoint.ecmwf_swell_direction,
      waveHeight: dataPoint.ecmwf_wave_height,
      shipSpeed: dataPoint.V_ship,
      distanceToDestination: dataPoint.D,
      eta
    };

    excelData.push(dataPoint);
    windData.push(windPoint);
  });

  return { excelData, windData };
};

// Generate additional wind data points for testing
export const generateExtendedWindData = (): ProcessedWindData[] => {
  const extendedData: ProcessedWindData[] = [];
  
  // Bay of Bengal grid pattern
  const latRange = { min: 18.5, max: 24.0 };
  const lngRange = { min: 84.0, max: 90.0 };
  
  // Generate grid of wind measurements (every 0.5 degrees)
  for (let lat = latRange.min; lat <= latRange.max; lat += 0.5) {
    for (let lng = lngRange.min; lng <= lngRange.max; lng += 0.5) {
      // Skip land areas (simplified)
      if (lng < 85.0 && lat < 20.0) continue; // Skip some coastal areas
      
      const windSpeed = 15 + Math.random() * 25; // 15-40 m/s range
      const windDir = Math.random() * 360; // Random direction
      
      extendedData.push({
        lat: parseFloat(lat.toFixed(2)),
        lng: parseFloat(lng.toFixed(2)),
        speed: parseFloat(windSpeed.toFixed(1)),
        direction: parseFloat(windDir.toFixed(0)),
        location: `Grid Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`
      });
    }
  }
  
  return extendedData;
};

// Validate Excel data structure
export const validateExcelData = (data: any[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  // Check if required columns exist
  const requiredColumns = ['ecmwf_wind_speed', 'ecmwf_wind_dir'];
  const firstRow = data[0];
  
  return requiredColumns.every(col => 
    firstRow.hasOwnProperty(col) && 
    typeof firstRow[col] === 'number' && 
    !isNaN(firstRow[col])
  );
};

// Format wind data for display
export const formatWindDataSummary = (windData: ProcessedWindData[]): string => {
  if (windData.length === 0) return 'No wind data available';
  
  const avgSpeed = windData.reduce((sum, point) => sum + point.speed, 0) / windData.length;
  const maxSpeed = Math.max(...windData.map(point => point.speed));
  const minSpeed = Math.min(...windData.map(point => point.speed));
  
  return `${windData.length} points | Avg: ${avgSpeed.toFixed(1)} m/s | Range: ${minSpeed.toFixed(1)}-${maxSpeed.toFixed(1)} m/s`;
};
