// Position interface for geographic coordinates
export interface Position {
  lat: number;
  lng: number;
  name: string;
  type?: 'departure' | 'destination' | 'waypoint' | 'course_change';
}

// Parse coordinates in format like "18.9449° N latitude and 72.8441° E longitude"
export const parseCoordinates = (coordinateString: string): Position => {
  try {
    // Extract latitude
    const latRegex = /(\d+\.?\d*)°\s*([NS])\s*latitude/i;
    const latMatch = coordinateString.match(latRegex);
    
    // Extract longitude
    const lngRegex = /(\d+\.?\d*)°\s*([EW])\s*longitude/i;
    const lngMatch = coordinateString.match(lngRegex);
    
    if (!latMatch || !lngMatch) {
      throw new Error('Invalid coordinate format');
    }
    
    // Parse latitude value and direction
    let lat = parseFloat(latMatch[1]);
    if (latMatch[2].toUpperCase() === 'S') {
      lat = -lat;
    }
    
    // Parse longitude value and direction
    let lng = parseFloat(lngMatch[1]);
    if (lngMatch[2].toUpperCase() === 'W') {
      lng = -lng;
    }
    
    return {
      lat,
      lng,
      name: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    };
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    throw new Error('Invalid coordinate format. Please use format like "18.9449° N latitude and 72.8441° E longitude"');
  }
}

// Global maritime locations and major ports worldwide
const GLOBAL_MARITIME_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  // ====== MAJOR GLOBAL PORTS ======
  // Asia-Pacific
  'singapore': { lat: 1.29, lng: 103.85, name: 'Port of Singapore' },
  'shanghai': { lat: 31.23, lng: 121.47, name: 'Port of Shanghai' },
  'hong kong': { lat: 22.32, lng: 114.17, name: 'Port of Hong Kong' },
  'busan': { lat: 35.10, lng: 129.04, name: 'Port of Busan' },
  'tokyo': { lat: 35.65, lng: 139.76, name: 'Port of Tokyo' },
  'yokohama': { lat: 35.44, lng: 139.64, name: 'Port of Yokohama' },
  'port klang': { lat: 3.00, lng: 101.39, name: 'Port Klang' },
  'colombo': { lat: 6.93, lng: 79.85, name: 'Port of Colombo' },

  // Middle East
  'dubai': { lat: 25.27, lng: 55.33, name: 'Port of Dubai' },
  'jebel ali': { lat: 25.01, lng: 55.13, name: 'Jebel Ali Port' },
  'doha': { lat: 25.29, lng: 51.53, name: 'Port of Doha' },

  // Europe
  'rotterdam': { lat: 51.88, lng: 4.40, name: 'Port of Rotterdam' },
  'antwerp': { lat: 51.22, lng: 4.40, name: 'Port of Antwerp' },
  'hamburg': { lat: 53.55, lng: 9.99, name: 'Port of Hamburg' },
  'london': { lat: 51.51, lng: -0.13, name: 'Port of London' },
  'marseille': { lat: 43.30, lng: 5.37, name: 'Port of Marseille' },

  // Americas
  'los angeles': { lat: 33.72, lng: -118.27, name: 'Port of Los Angeles' },
  'long beach': { lat: 33.75, lng: -118.19, name: 'Port of Long Beach' },
  'new york': { lat: 40.67, lng: -74.04, name: 'Port of New York' },
  'miami': { lat: 25.77, lng: -80.17, name: 'Port of Miami' },
  'santos': { lat: -23.96, lng: -46.33, name: 'Port of Santos' },

  // Indian Subcontinent (as part of global coverage)
  'mumbai': { lat: 18.94, lng: 72.83, name: 'Mumbai Port' },
  'chennai': { lat: 13.08, lng: 80.28, name: 'Chennai Port' },
  'kolkata': { lat: 22.57, lng: 88.36, name: 'Kolkata Port' },
  'cochin': { lat: 9.97, lng: 76.28, name: 'Cochin Port' },
  'kandla': { lat: 23.03, lng: 70.22, name: 'Kandla Port' },
  'visakhapatnam': { lat: 17.68, lng: 83.25, name: 'Visakhapatnam Port' },

  // ====== REGIONAL PORTS ======
  // Eastern Coast
  'port blair': { lat: 11.67, lng: 92.71, name: 'Port Blair' },
  'dhamra': { lat: 20.75, lng: 87.02, name: 'Dhamra Port' },
  'gopalpur': { lat: 19.32, lng: 84.98, name: 'Gopalpur Port' },
  'kalinganagar': { lat: 20.97, lng: 86.10, name: 'Dhamara Port (Kalinganagar)' },
  'gangavaram': { lat: 17.63, lng: 83.22, name: 'Gangavaram Port' },
  'krishnapatnam': { lat: 14.25, lng: 80.13, name: 'Krishnapatnam Port' },
  'machilipatnam': { lat: 16.17, lng: 81.13, name: 'Machilipatnam Port' },
  'nizzamapatnam': { lat: 15.10, lng: 80.60, name: 'Nizamapatnam Port' },
  'kakinada': { lat: 16.93, lng: 82.25, name: 'Kakinada Port' },
  
  // Western Coast
  'dighi': { lat: 18.17, lng: 72.97, name: 'Dighi Port' },
  'ratnagiri': { lat: 16.99, lng: 73.30, name: 'Ratnagiri Port' },
  'redi': { lat: 15.73, lng: 73.67, name: 'Redi Port' },
  'jaigarh': { lat: 17.28, lng: 73.17, name: 'Jaigarh Port' },
  'dabhol': { lat: 17.60, lng: 73.18, name: 'Dabhol Port' },
  'dharamtar': { lat: 18.88, lng: 72.97, name: 'Dharamtar Port' },
  'muldwarka': { lat: 20.77, lng: 70.37, name: 'Muldwarka Port' },
  'sikka': { lat: 22.43, lng: 69.83, name: 'Sikka Port' },
  'pipavav': { lat: 20.90, lng: 71.50, name: 'Pipavav Port' },
  'dahej': { lat: 21.70, lng: 72.60, name: 'Dahej Port' },
  'hazira': { lat: 21.12, lng: 72.63, name: 'Hazira Port' },
  'kattupalli': { lat: 13.33, lng: 80.33, name: 'Kattupalli Port' },
  'karaikal': { lat: 10.92, lng: 79.83, name: 'Karaikal Port' },
  'kozhikode': { lat: 11.25, lng: 75.77, name: 'Kozhikode Port' },
  'kollam': { lat: 8.88, lng: 76.60, name: 'Kollam Port' },
  'vizhinjam': { lat: 8.38, lng: 76.98, name: 'Vizhinjam Port' },
  
  // Additional International Ports
  'singapore_alt': { lat: 1.29, lng: 103.85, name: 'Port of Singapore' },
  'shanghai_alt': { lat: 31.23, lng: 121.47, name: 'Port of Shanghai' },
  'rotterdam_alt': { lat: 51.88, lng: 4.40, name: 'Port of Rotterdam' },
  'busan_alt': { lat: 35.10, lng: 129.04, name: 'Port of Busan' },
  'hamburg_alt': { lat: 53.54, lng: 9.98, name: 'Port of Hamburg' },
  'los_angeles_alt': { lat: 33.72, lng: -118.27, name: 'Port of Los Angeles' },
  'long_beach_alt': { lat: 33.75, lng: -118.19, name: 'Port of Long Beach' },
  'new_york_alt': { lat: 40.68, lng: -74.03, name: 'Port of New York' },
  'london_alt': { lat: 51.50, lng: -0.08, name: 'Port of London' },
  'tokyo_alt': { lat: 35.65, lng: 139.76, name: 'Port of Tokyo' },
  
  // Indian States with major ports
  'gujarat': { lat: 20.59, lng: 71.70, name: 'Gujarat (Kandla Port)' },
  'maharashtra': { lat: 18.96, lng: 72.82, name: 'Maharashtra (Mumbai Port)' },
  'tamil nadu': { lat: 13.08, lng: 80.27, name: 'Tamil Nadu (Chennai Port)' },
  'west bengal': { lat: 22.54, lng: 88.36, name: 'West Bengal (Kolkata Port)' },
  'andhra pradesh': { lat: 17.68, lng: 83.25, name: 'Andhra Pradesh (Visakhapatnam Port)' },
  'kerala': { lat: 9.97, lng: 76.28, name: 'Kerala (Cochin Port)' },
  'goa': { lat: 15.40, lng: 73.80, name: 'Goa (Mormugao Port)' },
  'karnataka': { lat: 12.91, lng: 74.82, name: 'Karnataka (New Mangalore Port)' },
  'odisha': { lat: 20.26, lng: 86.70, name: 'Odisha (Paradip Port)' }
};

export interface Position {
  lat: number;
  lng: number;
  name: string;
}

export const geocode = async (location: string): Promise<Position> => {
  if (!location) {
    throw new Error('Location is required');
  }

  const normalizedLocation = location.toLowerCase().trim();
  
  // Check if we have the location in our predefined list
  if (GLOBAL_MARITIME_LOCATIONS[normalizedLocation]) {
    return GLOBAL_MARITIME_LOCATIONS[normalizedLocation];
  }

  // Try to find a partial or fuzzy match
  const matchedLocation = Object.entries(GLOBAL_MARITIME_LOCATIONS).find(([key, value]) => {
    // Exact match
    if (key === normalizedLocation) return true;
    
    // Contains match (e.g., 'mumbai port' matches 'mumbai')
    if (key.includes(normalizedLocation) || normalizedLocation.includes(key)) return true;
    
    // Check if the location name contains the search term
    if (value.name.toLowerCase().includes(normalizedLocation)) return true;
    
    // Handle common abbreviations and alternative names
    const aliases: Record<string, string[]> = {
      'mumbai': ['bombay'],
      'chennai': ['madras'],
      'kolkata': ['calcutta'],
      'kochi': ['cochin', 'kochi port'],
      'visakhapatnam': ['vizag', 'vishakapatnam'],
      'tuticorin': ['thoothukudi'],
      'paradip': ['paradeep']
    };
    
    // Check aliases
    for (const [portName, altNames] of Object.entries(aliases)) {
      if (portName === key && altNames.some(alias => normalizedLocation.includes(alias))) {
        return true;
      }
    }
    
    // Check for state names
    const stateToPort: Record<string, string> = {
      'gujarat': 'kandla',
      'maharashtra': 'mumbai',
      'goa': 'mormugao',
      'karnataka': 'new mangalore',
      'kerala': 'cochin',
      'tamil nadu': 'chennai',
      'andhra pradesh': 'visakhapatnam',
      'odisha': 'paradip',
      'west bengal': 'kolkata'
    };
    
    if (stateToPort[normalizedLocation] === key) return true;
    
    return false;
  });

  if (matchedLocation) {
    return matchedLocation[1];
  }

  // Fallback to a simple geocoding API with better error handling
  try {
    const searchTerm = location.toLowerCase();
    
    // Try with 'port' suffix if not already present
    const searchQuery = searchTerm.includes('port') ? searchTerm : `${searchTerm} port`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      {
        headers: {
          'User-Agent': 'MaritimeWeatherDashboard/1.0 (your-email@example.com)'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const displayName = result.display_name.split(',')[0] || location;
      
      // Check if the result is likely a port or coastal area
      const isMaritimeLocation = 
        result.type === 'harbour' || 
        result.type === 'port' ||
        result.class === 'harbour' ||
        displayName.toLowerCase().includes('port') ||
        displayName.toLowerCase().includes('harbor') ||
        displayName.toLowerCase().includes('dock');
      
      if (!isMaritimeLocation) {
        console.warn(`Location '${location}' may not be a maritime location`);
      }
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: displayName
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  // If all else fails, return a generic ocean location
  console.warn(`Could not find exact match for '${location}'. Using generic coordinates.`);
  return {
    lat: 0,
    lng: 0,
    name: `Unknown location: ${location}`
  };
};

// Function to generate maritime route points (simplified version - in real app, use a proper routing service)
export const getMaritimeRoute = async (start: Position, end: Position): Promise<Position[]> => {
  // Simple interpolation for demo purposes
  // In a real app, you would use a maritime routing API
  const points: Position[] = [start];
  
  // Add some points in between to simulate a sea route
  const steps = 5;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    points.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
      name: `Waypoint ${i}`
    });
  }
  
  points.push(end);
  return points;
};
