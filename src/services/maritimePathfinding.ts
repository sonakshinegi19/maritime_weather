import { Position } from './geocoding';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { feature, point } from '@turf/helpers';
import { lineString, booleanIntersects } from '@turf/turf';

// ===================================================================
// ADVANCED MARITIME PATHFINDING SYSTEM
// ===================================================================
// This system creates maritime routes that properly avoid land masses
// by using coastline detection and strategic waypoint placement.
// ===================================================================

// Define major land masses and coastlines for avoidance
const LAND_MASSES = {
  // India subcontinent
  india: {
    bounds: { north: 37, south: 6, east: 97, west: 68 },
    coastalPoints: [
      { lat: 22.3, lng: 68.8 }, // Gujarat coast
      { lat: 19.1, lng: 72.9 }, // Mumbai
      { lat: 15.3, lng: 73.8 }, // Goa
      { lat: 12.9, lng: 74.8 }, // Mangalore
      { lat: 10.0, lng: 76.3 }, // Kochi
      { lat: 8.1, lng: 77.5 },  // Kanyakumari area
      { lat: 9.9, lng: 78.1 },  // Tuticorin
      { lat: 13.1, lng: 80.3 }, // Chennai
      { lat: 17.7, lng: 83.3 }, // Visakhapatnam
      { lat: 20.3, lng: 86.7 }, // Paradip
      { lat: 22.6, lng: 88.4 }  // Kolkata
    ]
  },
  
  // Southeast Asia
  southeastAsia: {
    bounds: { north: 25, south: -11, east: 141, west: 92 },
    coastalPoints: [
      { lat: 1.3, lng: 103.8 }, // Singapore
      { lat: 3.0, lng: 101.4 }, // Port Klang
      { lat: 5.4, lng: 100.3 }, // Penang
      { lat: 13.8, lng: 100.5 }, // Bangkok area
      { lat: 16.1, lng: 108.2 }, // Da Nang
      { lat: 10.8, lng: 106.7 }, // Ho Chi Minh
      { lat: -6.2, lng: 106.8 }, // Jakarta
      { lat: -7.3, lng: 112.7 }  // Surabaya
    ]
  },
  
  // Arabian Peninsula
  arabia: {
    bounds: { north: 32, south: 12, east: 60, west: 34 },
    coastalPoints: [
      { lat: 25.3, lng: 55.3 }, // Dubai
      { lat: 24.5, lng: 54.4 }, // Abu Dhabi
      { lat: 23.6, lng: 58.6 }, // Muscat
      { lat: 20.2, lng: 57.5 }, // Sur
      { lat: 15.4, lng: 49.1 }, // Aden
      { lat: 21.5, lng: 39.2 }  // Jeddah
    ]
  },
  
  // Europe
  europe: {
    bounds: { north: 71, south: 36, east: 40, west: -10 },
    coastalPoints: [
      { lat: 51.9, lng: 4.4 },   // Rotterdam
      { lat: 53.5, lng: 9.9 },   // Hamburg
      { lat: 59.9, lng: 10.8 },  // Oslo
      { lat: 60.2, lng: 24.9 },  // Helsinki
      { lat: 43.3, lng: 5.4 },   // Marseille
      { lat: 41.9, lng: 12.5 },  // Rome area
      { lat: 40.6, lng: 14.3 }   // Naples
    ]
  },
  
  // Africa
  africa: {
    bounds: { north: 37, south: -35, east: 52, west: -18 },
    coastalPoints: [
      { lat: 31.2, lng: 29.9 },  // Alexandria
      { lat: 15.6, lng: 32.5 },  // Port Sudan
      { lat: 11.6, lng: 43.1 },  // Djibouti
      { lat: -4.0, lng: 39.7 },  // Mombasa
      { lat: -26.0, lng: 28.0 }, // Durban area
      { lat: -33.9, lng: 18.4 }, // Cape Town
      { lat: 33.6, lng: -7.6 }   // Casablanca
    ]
  }
};

// Major shipping lanes and safe passages
const SHIPPING_LANES = [
  // Suez Canal
  { start: { lat: 31.25, lng: 32.35 }, end: { lat: 29.97, lng: 32.57 }, name: 'Suez Canal' },
  
  // Strait of Hormuz
  { start: { lat: 26.57, lng: 56.25 }, end: { lat: 26.57, lng: 56.38 }, name: 'Strait of Hormuz' },
  
  // Strait of Malacca
  { start: { lat: 1.43, lng: 103.72 }, end: { lat: 5.64, lng: 95.32 }, name: 'Strait of Malacca' },
  
  // English Channel
  { start: { lat: 50.77, lng: 1.61 }, end: { lat: 49.70, lng: -4.13 }, name: 'English Channel' },
  
  // Gibraltar Strait
  { start: { lat: 36.14, lng: -5.35 }, end: { lat: 35.89, lng: -5.32 }, name: 'Strait of Gibraltar' },
];

// Remove duplicate import and variable declaration for landPolygons

// Mark createSeaRoute as async and await all async route creators
async function createSeaRoute(start: Position, end: Position): Promise<Position[]> {
  const path: Position[] = [start];
  
  // Calculate great circle distance
  const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  console.log(`🌊 Great circle distance: ${distance.toFixed(1)} km`);
  
  // Determine if we need special routing based on geography
  const routeType = determineRouteType(start, end);
  console.log(`🌊 Route type: ${routeType}`);
  
  let waypoints: Position[] = [];
  
  switch (routeType) {
    case 'india-to-southeast-asia':
      waypoints = await createIndiaToSoutheastAsiaRoute(start, end);
      break;
    case 'india-to-middle-east':
      waypoints = await createIndiaToMiddleEastRoute(start, end);
      break;
    case 'europe-to-asia':
      waypoints = await createEuropeToAsiaRoute(start, end);
      break;
    case 'around-africa':
      waypoints = await createAroundAfricaRoute(start, end);
      break;
    case 'trans-pacific':
      waypoints = await createTransPacificRoute(start, end);
      break;
    case 'trans-atlantic':
      waypoints = await createTransAtlanticRoute(start, end);
      break;
    case 'coastal':
      waypoints = await createCoastalRoute(start, end);
      break;
    default:
      waypoints = await createOpenSeaRoute(start, end);
  }
  
  // Add waypoints to path
  path.push(...waypoints);
  path.push(end);
  
  // Validate that all points are in water
  const validatedPath = await validateSeaRoute(path);
  
  return validatedPath;
}

// Update findMaritimePath to await createSeaRoute and mark as async
export async function findMaritimePath(start: Position, end: Position): Promise<Position[]> {
  console.log(`🚢 MARITIME: Finding sea route from ${start.name} (${start.lat.toFixed(2)}, ${start.lng.toFixed(2)}) to ${end.name} (${end.lat.toFixed(2)}, ${end.lng.toFixed(2)})`);
  
  // Create maritime route with proper land avoidance
  const path = await createSeaRoute(start, end);
  
  console.log(`🚢 MARITIME: Generated ${path.length} waypoints for sea-only route`);

  // Ensure no segment crosses land by inserting sea midpoints where needed
  const seaSafePath = await ensureSeaSafeSegments(path);
  return seaSafePath;
}

function determineRouteType(start: Position, end: Position): string {
  // India to Southeast Asia (through Malacca Strait)
  if (isInIndia(start) && isInSoutheastAsia(end)) {
    return 'india-to-southeast-asia';
  }
  
  // India to Middle East (Arabian Sea)
  if (isInIndia(start) && isInMiddleEast(end)) {
    return 'india-to-middle-east';
  }
  
  // Europe to Asia (through Suez)
  if (isInEurope(start) && (isInIndia(end) || isInSoutheastAsia(end) || isInMiddleEast(end))) {
    return 'europe-to-asia';
  }
  
  // Around Africa route
  if ((isInEurope(start) || isInMiddleEast(start)) && (end.lat < -20 || (end.lng > 20 && end.lng < 60 && end.lat < 0))) {
    return 'around-africa';
  }
  
  // Trans-Pacific
  if (Math.abs(end.lng - start.lng) > 120) {
    return 'trans-pacific';
  }
  
  // Trans-Atlantic
  if ((start.lng < -30 && end.lng > 0) || (start.lng > 0 && end.lng < -30)) {
    return 'trans-atlantic';
  }
  
  // Coastal route (same region)
  if (calculateDistance(start.lat, start.lng, end.lat, end.lng) < 1000) {
    return 'coastal';
  }
  
  return 'open-sea';
}

function createIndiaToSoutheastAsiaRoute(start: Position, end: Position): Position[] {
  const waypoints: Position[] = [];
  
  // Go south from Indian coast to avoid Sri Lanka
  waypoints.push({
    lat: Math.min(start.lat - 3, 5),
    lng: start.lng + 2,
    name: 'South of Sri Lanka'
  });
  
  // Head towards Malacca Strait
  waypoints.push({
    lat: 6,
    lng: 95,
    name: 'Approach to Malacca Strait'
  });
  
  // Through Malacca Strait
  waypoints.push({
    lat: 3.5,
    lng: 98.5,
    name: 'Malacca Strait'
  });
  
  // Singapore area
  waypoints.push({
    lat: 1.3,
    lng: 103.8,
    name: 'Singapore Strait'
  });
  
  // If destination is further east, continue through Indonesian waters
  if (end.lng > 110) {
    waypoints.push({
      lat: -2,
      lng: 108,
      name: 'Java Sea'
    });
    
    if (end.lng > 120) {
      waypoints.push({
        lat: -5,
        lng: 115,
        name: 'Makassar Strait'
      });
    }
  }
  
  return waypoints;
}

function createIndiaToMiddleEastRoute(start: Position, end: Position): Position[] {
  const waypoints: Position[] = [];
  
  // Head west across Arabian Sea
  waypoints.push({
    lat: start.lat,
    lng: start.lng - 8,
    name: 'Arabian Sea'
  });
  
  // Approach to Strait of Hormuz if going to Persian Gulf
  if (end.lat > 24 && end.lng > 48 && end.lng < 58) {
    waypoints.push({
      lat: 26.5,
      lng: 56.3,
      name: 'Strait of Hormuz'
    });
  }
  
  return waypoints;
}

function createEuropeToAsiaRoute(start: Position, end: Position): Position[] {
  const waypoints: Position[] = [];
  
  // Head towards Gibraltar if starting from Atlantic Europe
  if (start.lng < 0) {
    waypoints.push({
      lat: 36,
      lng: -5.3,
      name: 'Strait of Gibraltar'
    });
  }
  
  // Mediterranean Sea
  waypoints.push({
    lat: 35,
    lng: 18,
    name: 'Central Mediterranean'
  });
  
  // Approach to Suez Canal
  waypoints.push({
    lat: 31.5,
    lng: 32.3,
    name: 'Suez Canal North'
  });
  
  // Through Suez Canal
  waypoints.push({
    lat: 30,
    lng: 32.5,
    name: 'Suez Canal South'
  });
  
  // Red Sea
  waypoints.push({
    lat: 20,
    lng: 38,
    name: 'Red Sea'
  });
  
  // Gulf of Aden
  waypoints.push({
    lat: 12.5,
    lng: 45,
    name: 'Gulf of Aden'
  });
  
  // Arabian Sea
  waypoints.push({
    lat: 15,
    lng: 60,
    name: 'Arabian Sea'
  });
  
  return waypoints;
}

function createAroundAfricaRoute(start: Position, end: Position): Position[] {
  const waypoints: Position[] = [];
  
  // Head south along African coast
  waypoints.push({
    lat: 20,
    lng: 15,
    name: 'West Africa'
  });
  
  // Around Cape of Good Hope
  waypoints.push({
    lat: -35,
    lng: 15,
    name: 'Cape of Good Hope Approach'
  });
  
  waypoints.push({
    lat: -35,
    lng: 20,
    name: 'Cape of Good Hope'
  });
  
  // Up the east coast of Africa
  waypoints.push({
    lat: -20,
    lng: 35,
    name: 'East Africa'
  });
  
  return waypoints;
}

function createTransPacificRoute(start: Position, end: Position): Position[] {
  const waypoints: Position[] = [];
  
  // Great circle route with slight northern bias to avoid equatorial calms
  const midLat = (start.lat + end.lat) / 2 + 5;
  const midLng = (start.lng + end.lng) / 2;
  
  waypoints.push({
    lat: midLat,
    lng: midLng,
    name: 'Mid-Pacific'
  });
  
  return waypoints;
}

function createTransAtlanticRoute(start: Position, end: Position): Position[] {
  const waypoints: Position[] = [];
  
  // Great circle route with slight northern bias
  const midLat = (start.lat + end.lat) / 2 + 3;
  const midLng = (start.lng + end.lng) / 2;
  
  waypoints.push({
    lat: midLat,
    lng: midLng,
    name: 'Mid-Atlantic'
  });
  
  return waypoints;
}

async function createCoastalRoute(start: Position, end: Position): Promise<Position[]> {
  const waypoints: Position[] = [];
  
  // Simple coastal route with offshore waypoints
  const numWaypoints = Math.max(2, Math.floor(calculateDistance(start.lat, start.lng, end.lat, end.lng) / 200));
  
  for (let i = 1; i < numWaypoints; i++) {
    const t = i / numWaypoints;
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    
    // Push slightly offshore
    const offsetLat = lat + (Math.random() - 0.5) * 0.5;
    const isCoastal = await isCoastalPoint(lat, lng);
    const offsetLng = lng + (isCoastal ? (lng > 0 ? 1 : -1) : 0);
    
    waypoints.push({
      lat: offsetLat,
      lng: offsetLng,
      name: `Coastal Waypoint ${i}`
    });
  }
  
  return waypoints;
}

function createOpenSeaRoute(start: Position, end: Position): Position[] {
  const waypoints: Position[] = [];
  
  // Simple great circle route for open sea
  const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  const numWaypoints = Math.max(1, Math.floor(distance / 500)); // One waypoint per 500km
  
  for (let i = 1; i <= numWaypoints; i++) {
    const t = i / (numWaypoints + 1);
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    
    waypoints.push({
      lat,
      lng,
      name: `Open Sea Waypoint ${i}`
    });
  }
  
  return waypoints;
}

// Update all usages of isOverLand to be async and use await
export async function validateSeaRoute(path: Position[]): Promise<Position[]> {
  const validatedPath: Position[] = [];
  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    if (await isOverLand(point.lat, point.lng)) {
      console.log(`⚠️ Point ${point.name} is over land, adjusting to sea`);
      const seaPoint = await moveToSea(point.lat, point.lng);
      validatedPath.push({
        ...point,
        lat: seaPoint.lat,
        lng: seaPoint.lng,
        name: point.name + ' (adjusted to sea)'
      });
    } else {
      validatedPath.push(point);
    }
  }
  return validatedPath;
}

// Ensure each consecutive segment does not intersect land. If it does, insert a midpoint
// adjusted to sea and recursively validate the two sub-segments.
async function ensureSeaSafeSegments(path: Position[]): Promise<Position[]> {
  if (path.length <= 1) return path;

  const result: Position[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const segment = await fixSegmentIfIntersectsLand(a, b, 0);
    if (i === 0) {
      result.push(...segment);
    } else {
      // Avoid duplicating the first point of the segment
      result.push(...segment.slice(1));
    }
  }
  return result;
}

async function fixSegmentIfIntersectsLand(a: Position, b: Position, depth: number): Promise<Position[]> {
  // Safety cap to prevent infinite recursion
  const MAX_DEPTH = 6;
  const polygons = await loadLandPolygons();
  const line = lineString([[a.lng, a.lat], [b.lng, b.lat]]);
  let intersects = false;
  for (const feature of polygons.features) {
    if (booleanIntersects(line, feature)) {
      intersects = true;
      break;
    }
  }

  if (!intersects || depth >= MAX_DEPTH) {
    return [a, b];
  }

  // Compute midpoint and push it offshore to sea
  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;
  const seaMid = await moveToSea(midLat, midLng);
  const mid: Position = { lat: seaMid.lat, lng: seaMid.lng, name: 'Sea Midpoint', type: 'waypoint' as const };

  const left = await fixSegmentIfIntersectsLand(a, mid, depth + 1);
  const right = await fixSegmentIfIntersectsLand(mid, b, depth + 1);

  // Merge, dropping duplicated midpoint
  return [...left, ...right.slice(1)];
}

export async function moveToSea(lat: number, lng: number): Promise<{ lat: number; lng: number }> {
  let step = 0.2; // degrees
  let maxTries = 50;
  let angle = 0;
  let tries = 0;
  while (await isOverLand(lat, lng) && tries < maxTries) {
    angle += Math.PI / 4;
    lat += step * Math.sin(angle);
    lng += step * Math.cos(angle);
    tries++;
  }
  return { lat, lng };
}

export async function isCoastalPoint(lat: number, lng: number): Promise<boolean> {
  return await isOverLand(lat + 0.5, lng) || await isOverLand(lat - 0.5, lng) ||
         await isOverLand(lat, lng + 0.5) || await isOverLand(lat, lng - 0.5);
}

// Remove direct import of landPolygons
// Use async loader for GeoJSON from public folder
let landPolygons: any = null;
export async function loadLandPolygons() {
  if (!landPolygons) {
  const response = await fetch('/landPolygons.geojson');
    landPolygons = await response.json();
  }
  return landPolygons;
}

// Example usage in isOverLand (make this async in your app)
export async function isOverLand(lat: number, lng: number): Promise<boolean> {
  const polygons = await loadLandPolygons();
  const pt = point([lng, lat]);
  for (const feature of polygons.features) {
    if (booleanPointInPolygon(pt, feature)) {
      return true;
    }
  }
  return false;
}

// Helper functions for geographic regions
function isInIndia(pos: Position): boolean {
  return pos.lat > 6 && pos.lat < 37 && pos.lng > 68 && pos.lng < 97;
}

function isInSoutheastAsia(pos: Position): boolean {
  return pos.lat > -11 && pos.lat < 25 && pos.lng > 92 && pos.lng < 141;
}

function isInMiddleEast(pos: Position): boolean {
  return pos.lat > 12 && pos.lat < 42 && pos.lng > 25 && pos.lng < 65;
}

function isInEurope(pos: Position): boolean {
  return pos.lat > 36 && pos.lat < 71 && pos.lng > -10 && pos.lng < 40;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
