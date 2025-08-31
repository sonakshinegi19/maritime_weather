export interface Port {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: 'major' | 'regional' | 'local';
  facilities: string[];
  maxDraft: number; // in meters
  approaches: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  region?: 'asia' | 'europe' | 'north_america' | 'south_america' | 'africa' | 'oceania' | 'middle_east';
  unlocode?: string; // UN/LOCODE for international port identification
  restrictions?: string[]; // Any special restrictions or requirements
  anchorage?: boolean; // Whether the port has anchorage facilities
}

export const WORLD_PORTS: Port[] = [
  // Major Indian Ports
  {
    id: 'IN_MUMBAI',
    name: 'Mumbai Port',
    country: 'India',
    lat: 18.94,
    lng: 72.83,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger', 'fuel'],
    maxDraft: 11.0,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'IN_NHAVA_SHEVA',
    name: 'Jawaharlal Nehru Port (Nhava Sheva)',
    country: 'India',
    lat: 18.95,
    lng: 72.95,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel'],
    maxDraft: 14.0,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'IN_CHENNAI',
    name: 'Chennai Port',
    country: 'India',
    lat: 13.08,
    lng: 80.28,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger', 'fuel'],
    maxDraft: 12.0,
    approaches: { north: true, south: true, east: true, west: false }
  },
  {
    id: 'IN_KOLKATA',
    name: 'Syama Prasad Mookerjee Port (Kolkata)',
    country: 'India',
    lat: 22.57,
    lng: 88.36,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger'],
    maxDraft: 8.5,
    approaches: { north: true, south: true, east: true, west: false }
  },
  {
    id: 'IN_COCHIN',
    name: 'Cochin Port',
    country: 'India',
    lat: 9.97,
    lng: 76.28,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger', 'fuel'],
    maxDraft: 12.0,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'IN_VISAKHAPATNAM',
    name: 'Visakhapatnam Port',
    country: 'India',
    lat: 17.68,
    lng: 83.25,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel'],
    maxDraft: 16.5,
    approaches: { north: true, south: true, east: true, west: false }
  },
  {
    id: 'IN_KANDLA',
    name: 'Deendayal Port (Kandla)',
    country: 'India',
    lat: 23.03,
    lng: 70.22,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel'],
    maxDraft: 12.5,
    approaches: { north: true, south: true, east: false, west: true }
  },

  // Major International Ports
  {
    id: 'SG_SINGAPORE',
    name: 'Port of Singapore',
    country: 'Singapore',
    lat: 1.29,
    lng: 103.85,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger', 'fuel', 'repair'],
    maxDraft: 20.0,
    approaches: { north: true, south: true, east: true, west: true }
  },
  {
    id: 'CN_SHANGHAI',
    name: 'Port of Shanghai',
    country: 'China',
    lat: 31.23,
    lng: 121.47,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel'],
    maxDraft: 15.0,
    approaches: { north: true, south: true, east: true, west: false }
  },
  {
    id: 'AE_DUBAI',
    name: 'Port of Dubai',
    country: 'UAE',
    lat: 25.27,
    lng: 55.33,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger', 'fuel'],
    maxDraft: 14.0,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'NL_ROTTERDAM',
    name: 'Port of Rotterdam',
    country: 'Netherlands',
    lat: 51.88,
    lng: 4.40,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel', 'repair'],
    maxDraft: 24.0,
    approaches: { north: true, south: false, east: false, west: true }
  },
  {
    id: 'US_LOS_ANGELES',
    name: 'Port of Los Angeles',
    country: 'USA',
    lat: 33.72,
    lng: -118.27,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger', 'fuel'],
    maxDraft: 16.0,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'KR_BUSAN',
    name: 'Port of Busan',
    country: 'South Korea',
    lat: 35.10,
    lng: 129.04,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel'],
    maxDraft: 17.0,
    approaches: { north: true, south: true, east: true, west: false }
  },
  {
    id: 'JP_TOKYO',
    name: 'Port of Tokyo',
    country: 'Japan',
    lat: 35.65,
    lng: 139.76,
    type: 'major',
    facilities: ['container', 'bulk', 'passenger', 'fuel'],
    maxDraft: 12.0,
    approaches: { north: true, south: true, east: true, west: false }
  },

  // Regional Ports
  {
    id: 'IN_MANGALORE',
    name: 'New Mangalore Port',
    country: 'India',
    lat: 12.91,
    lng: 74.82,
    type: 'regional',
    facilities: ['bulk', 'fuel'],
    maxDraft: 14.5,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'IN_TUTICORIN',
    name: 'V.O. Chidambaranar Port (Tuticorin)',
    country: 'India',
    lat: 8.77,
    lng: 78.13,
    type: 'regional',
    facilities: ['container', 'bulk'],
    maxDraft: 12.8,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'IN_PARADIP',
    name: 'Paradip Port',
    country: 'India',
    lat: 20.26,
    lng: 86.70,
    type: 'regional',
    facilities: ['bulk', 'fuel'],
    maxDraft: 18.0,
    approaches: { north: true, south: true, east: true, west: false }
  },
  {
    id: 'LK_COLOMBO',
    name: 'Port of Colombo',
    country: 'Sri Lanka',
    lat: 6.93,
    lng: 79.85,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel'],
    maxDraft: 15.0,
    approaches: { north: true, south: true, east: false, west: true }
  },
  {
    id: 'MY_PORT_KLANG',
    name: 'Port Klang',
    country: 'Malaysia',
    lat: 3.00,
    lng: 101.39,
    type: 'major',
    facilities: ['container', 'bulk', 'fuel'],
    maxDraft: 17.0,
    approaches: { north: true, south: true, east: false, west: true }
  }
];

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Find nearest port within a given distance
export const findNearestPort = (lat: number, lng: number, maxDistance: number = 100): Port | null => {
  let nearestPort: Port | null = null;
  let minDistance = maxDistance;

  for (const port of WORLD_PORTS) {
    const distance = calculateDistance(lat, lng, port.lat, port.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPort = port;
    }
  }

  return nearestPort;
};

// Find nearest port within a given distance by region
export const findNearestPortByRegion = (lat: number, lng: number, region: string, maxDistance: number = 100): Port | null => {
  let nearestPort: Port | null = null;
  let minDistance = maxDistance;

  const portsInRegion = WORLD_PORTS.filter(port => port.region === region);

  for (const port of portsInRegion) {
    const distance = calculateDistance(lat, lng, port.lat, port.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPort = port;
    }
  }

  return nearestPort;
};

// Add new ports to the database
export const addPortsToDatabase = (newPorts: Port[]): void => {
  // Check for duplicate IDs
  const existingIds = new Set(WORLD_PORTS.map(port => port.id));
  const validNewPorts = newPorts.filter(port => {
    if (existingIds.has(port.id)) {
      console.warn(`Port with ID ${port.id} already exists in database. Skipping.`);
      return false;
    }
    return true;
  });
  
  // Add valid new ports to the database
  (WORLD_PORTS as Port[]).push(...validNewPorts);
  console.log(`Added ${validNewPorts.length} new ports to the database.`);
};

// Get ports within a certain radius
export const getPortsInRadius = (lat: number, lng: number, radius: number = 200): Port[] => {
  return WORLD_PORTS.filter(port => {
    const distance = calculateDistance(lat, lng, port.lat, port.lng);
    return distance <= radius;
  }).sort((a, b) => {
    const distA = calculateDistance(lat, lng, a.lat, a.lng);
    const distB = calculateDistance(lat, lng, b.lat, b.lng);
    return distA - distB;
  });
};

// Search ports by name or country
export const searchPorts = (query: string): Port[] => {
  const searchTerm = query.toLowerCase();
  return WORLD_PORTS.filter(port =>
    port.name.toLowerCase().includes(searchTerm) ||
    port.country.toLowerCase().includes(searchTerm)
  );
};

// Get major shipping lanes (simplified for demo)
export const getShippingLanes = () => {
  return [
    // Arabian Sea to Bay of Bengal (around India)
    { start: { lat: 18.94, lng: 72.83 }, end: { lat: 13.08, lng: 80.28 }, name: 'Mumbai-Chennai Lane' },
    // Singapore Strait
    { start: { lat: 1.29, lng: 103.85 }, end: { lat: 6.93, lng: 79.85 }, name: 'Singapore-Colombo Lane' },
    // Suez Canal approach
    { start: { lat: 25.27, lng: 55.33 }, end: { lat: 31.23, lng: 121.47 }, name: 'Dubai-Shanghai Lane' },
  ];
};
