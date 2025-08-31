import { ExtremeWeatherCondition, AlternativeRoute } from '../types/weather';
import { Position } from './geocoding';
import * as turf from '@turf/turf';

export interface WeatherData {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    pressure: number;
    condition: string;
    icon: string;
  };
  marine: {
    waveHeight: number;
    swellHeight: number;
    swellDirection: number;
    seaTemperature: number;
    tideLevel: string;
  };
  forecast: Array<{
    date: string;
    temperature: { min: number; max: number };
    condition: string;
    windSpeed: number;
    waveHeight: number;
  }>;
  alerts: Array<{
    type: 'storm' | 'fog' | 'high_waves' | 'strong_wind';
    severity: 'low' | 'medium' | 'high';
    message: string;
    validUntil: string;
  }>;
}

// Mock weather data generator for demo purposes
// In production, this would call a real weather API like OpenWeatherMap
const generateMockWeatherData = (lat: number, lng: number, locationName: string): WeatherData => {
  // Generate realistic weather based on location
  const isTropical = lat >= -23.5 && lat <= 23.5;
  const isNorthern = lat > 0;
  
  // Base temperature on latitude and season
  const baseTemp = isTropical ? 28 : isNorthern ? 15 : 20;
  const tempVariation = Math.random() * 10 - 5;
  const temperature = Math.round(baseTemp + tempVariation);
  
  // Generate wind data
  const windSpeed = Math.round(5 + Math.random() * 25); // 5-30 knots
  const windDirection = Math.round(Math.random() * 360);
  
  // Generate wave data based on wind
  const waveHeight = Math.round((windSpeed / 10 + Math.random() * 2) * 10) / 10;
  const swellHeight = Math.round((waveHeight * 0.7 + Math.random() * 1) * 10) / 10;
  
  // Generate weather condition
  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Moderate Rain', 'Thunderstorms'];
  const weights = [0.3, 0.25, 0.2, 0.15, 0.08, 0.02]; // Probability weights
  let condition = 'Clear';
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < conditions.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      condition = conditions[i];
      break;
    }
  }
  
  // Generate alerts based on conditions
  const alerts: WeatherData['alerts'] = [];
  if (windSpeed > 25) {
    alerts.push({
      type: 'strong_wind',
      severity: windSpeed > 35 ? 'high' : 'medium',
      message: `Strong winds expected: ${windSpeed} knots`,
      validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    });
  }
  if (waveHeight > 3) {
    alerts.push({
      type: 'high_waves',
      severity: waveHeight > 5 ? 'high' : 'medium',
      message: `High waves: ${waveHeight}m`,
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    });
  }
  if (condition.includes('Thunderstorms')) {
    alerts.push({
      type: 'storm',
      severity: 'high',
      message: 'Thunderstorms in the area',
      validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
  }
  
  // Generate forecast
  const forecast = [];
  for (let i = 1; i <= 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      temperature: {
        min: temperature - 3 + Math.round(Math.random() * 2),
        max: temperature + 3 + Math.round(Math.random() * 4)
      },
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      windSpeed: Math.round(windSpeed + (Math.random() - 0.5) * 10),
      waveHeight: Math.round((waveHeight + (Math.random() - 0.5) * 2) * 10) / 10
    });
  }

  return {
    location: {
      name: locationName,
      lat,
      lng
    },
    current: {
      temperature,
      humidity: Math.round(60 + Math.random() * 30),
      windSpeed,
      windDirection,
      visibility: Math.round(8 + Math.random() * 7), // 8-15 nautical miles
      pressure: Math.round(1010 + (Math.random() - 0.5) * 20),
      condition,
      icon: condition.toLowerCase().replace(/\s+/g, '_')
    },
    marine: {
      waveHeight,
      swellHeight,
      swellDirection: Math.round(windDirection + (Math.random() - 0.5) * 60),
      seaTemperature: Math.round(temperature - 2 + Math.random() * 4),
      tideLevel: ['High', 'Low', 'Rising', 'Falling'][Math.floor(Math.random() * 4)]
    },
    forecast,
    alerts
  };
};

// Get weather data for a location
export const getWeatherData = async (lat: number, lng: number, locationName?: string): Promise<WeatherData> => {
  // In production, replace this with actual API call
  // Example: OpenWeatherMap API
  /*
  const API_KEY = 'your_api_key';
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`
  );
  const data = await response.json();
  */
  
  // For demo, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockWeatherData(lat, lng, locationName || `Location ${lat.toFixed(2)}, ${lng.toFixed(2)}`));
    }, 500); // Simulate API delay
  });
};

// Get weather data for multiple locations (route)
export const getRouteWeatherData = async (locations: Array<{ lat: number; lng: number; name: string }>): Promise<WeatherData[]> => {
  const weatherPromises = locations.map(location => 
    getWeatherData(location.lat, location.lng, location.name)
  );
  
  return Promise.all(weatherPromises);
};

// Get weather alerts for a route
export const getRouteAlerts = async (locations: Array<{ lat: number; lng: number; name: string }>): Promise<WeatherData['alerts']> => {
  const weatherData = await getRouteWeatherData(locations);
  
  // Combine all alerts from all locations
  const allAlerts: WeatherData['alerts'] = [];
  weatherData.forEach(data => {
    allAlerts.push(...data.alerts);
  });
  
  // Sort by severity and remove duplicates
  return allAlerts
    .sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
    .filter((alert, index, arr) => 
      arr.findIndex(a => a.type === alert.type && a.message === alert.message) === index
    );
};

// Convert wind direction to compass direction
export const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Get weather condition icon
export const getWeatherIcon = (condition: string): string => {
  const conditions: Record<string, string> = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'mist': '🌫️',
    'fog': '🌫️',
    'haze': '🌫️',
    'tsunami': '🌊',
    'cyclone': '🌀',
    'storm': '🌪️',
    'high_tide': '🌊',
    'extreme': '⚠️'
  };
  
  const lowerCondition = condition.toLowerCase();
  return conditions[lowerCondition] || '🌡️';
}

/**
 * Get extreme weather conditions affecting a route
 */
/**
 * Get extreme weather conditions affecting a route
 * @param route - Array of positions representing the route
 * @returns Array of weather conditions placed strategically along the route
 */
export const getExtremeWeatherConditions = (route?: Position[]): ExtremeWeatherCondition[] => {
  console.log('Generating weather conditions for route:', route?.length || 0, 'points');
  
  // If no route provided, return default fixed locations
  if (!route || route.length === 0) {
    return getDefaultWeatherConditions();
  }
  
  // Generate weather conditions along the route
  const weatherConditions: ExtremeWeatherCondition[] = [];
  const routeLength = route.length;
  
  // Calculate route distance for better spacing
  let totalDistance = 0;
  for (let i = 1; i < routeLength; i++) {
    const dist = Math.sqrt(
      Math.pow(route[i].lat - route[i-1].lat, 2) + 
      Math.pow(route[i].lng - route[i-1].lng, 2)
    );
    totalDistance += dist;
  }
  
  // Place 2-4 weather conditions strategically along the route based on distance
  const numConditions = Math.min(4, Math.max(2, Math.floor(totalDistance * 10)));
  
  for (let i = 0; i < numConditions; i++) {
    // Calculate position along route based on distance
    const targetDistance = (totalDistance * (i + 1)) / (numConditions + 1);
    let currentDistance = 0;
    let routeIndex = 0;
    
    // Find the route segment where weather should be placed
    for (let j = 1; j < routeLength && currentDistance < targetDistance; j++) {
      const segmentDist = Math.sqrt(
        Math.pow(route[j].lat - route[j-1].lat, 2) + 
        Math.pow(route[j].lng - route[j-1].lng, 2)
      );
      if (currentDistance + segmentDist >= targetDistance) {
        routeIndex = j;
        break;
      }
      currentDistance += segmentDist;
    }
    
    const routePoint = route[Math.min(routeIndex, routeLength - 1)];
    
    // Add smaller randomness to keep weather closer to route (within 20-50km)
    const offsetLat = (Math.random() - 0.5) * 0.5; // ~25km offset
    const offsetLng = (Math.random() - 0.5) * 0.5;
    
    const weatherTypes: Array<ExtremeWeatherCondition['type']> = ['storm', 'cyclone', 'high_tide', 'tsunami'];
    const weatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    // Generate weather properties based on type
    const weatherProps = generateWeatherProperties(weatherType, i);
    
    const condition: ExtremeWeatherCondition = {
      id: `dynamic-${weatherType}-${i}-${Date.now()}`,
      type: weatherType,
      position: {
        lat: routePoint.lat + offsetLat,
        lng: routePoint.lng + offsetLng
      },
      radius: weatherProps.radius,
      intensity: weatherProps.intensity,
      name: weatherProps.name,
      description: weatherProps.description,
      impact: weatherProps.impact
    };
    
    weatherConditions.push(condition);
  }
  
  console.log('Generated weather conditions:', weatherConditions);
  return weatherConditions;
};

/**
 * Generate weather properties based on type
 */
function generateWeatherProperties(type: ExtremeWeatherCondition['type'], index: number) {
  const baseIntensity = 5 + Math.random() * 4; // 5-9 intensity
  
  switch (type) {
    case 'tsunami':
      return {
        radius: 40 + Math.random() * 30, // 40-70km
        intensity: Math.max(7, baseIntensity),
        name: `Tsunami Warning Zone ${index + 1}`,
        description: 'Extremely high waves and strong currents. Navigation strongly discouraged.',
        impact: {
          waveHeight: 12 + Math.random() * 8, // 12-20m
          windSpeed: 25 + Math.random() * 15, // 25-40 m/s
          currentSpeed: 10 + Math.random() * 10, // 10-20 knots
          visibility: 0.5 + Math.random() * 1.5 // 0.5-2 km
        }
      };
    
    case 'cyclone':
      return {
        radius: 80 + Math.random() * 60, // 80-140km
        intensity: Math.max(6, baseIntensity),
        name: `Cyclone Zone ${index + 1}`,
        description: 'Severe tropical storm with high winds and heavy rain.',
        impact: {
          waveHeight: 8 + Math.random() * 6, // 8-14m
          windSpeed: 30 + Math.random() * 15, // 30-45 m/s
          currentSpeed: 5 + Math.random() * 8, // 5-13 knots
          visibility: 1 + Math.random() * 2 // 1-3 km
        }
      };
    
    case 'storm':
      return {
        radius: 50 + Math.random() * 40, // 50-90km
        intensity: baseIntensity,
        name: `Severe Storm ${index + 1}`,
        description: 'Heavy rain and strong winds. Reduced visibility.',
        impact: {
          waveHeight: 4 + Math.random() * 6, // 4-10m
          windSpeed: 15 + Math.random() * 15, // 15-30 m/s
          currentSpeed: 3 + Math.random() * 6, // 3-9 knots
          visibility: 2 + Math.random() * 3 // 2-5 km
        }
      };
    
    case 'high_tide':
      return {
        radius: 30 + Math.random() * 25, // 30-55km
        intensity: Math.min(6, baseIntensity),
        name: `High Tide Zone ${index + 1}`,
        description: 'Exceptionally high tides affecting navigation.',
        impact: {
          waveHeight: 2 + Math.random() * 4, // 2-6m
          windSpeed: 10 + Math.random() * 10, // 10-20 m/s
          currentSpeed: 8 + Math.random() * 8, // 8-16 knots
          visibility: 4 + Math.random() * 4 // 4-8 km
        }
      };
    
    default:
      return {
        radius: 60,
        intensity: 6,
        name: `Weather Condition ${index + 1}`,
        description: 'Adverse weather conditions.',
        impact: {
          waveHeight: 5,
          windSpeed: 20,
          currentSpeed: 5,
          visibility: 3
        }
      };
  }
}

/**
 * Default weather conditions (fallback when no route provided)
 */
function getDefaultWeatherConditions(): ExtremeWeatherCondition[] {
  return [
    {
      id: 'default-tsunami-1',
      type: 'tsunami',
      position: { lat: 15.0, lng: 80.0 },
      radius: 50,
      intensity: 9,
      name: 'Tsunami Warning Zone',
      description: 'Extremely high waves and strong currents. Navigation strongly discouraged.',
      impact: {
        waveHeight: 15,
        windSpeed: 30,
        currentSpeed: 15,
        visibility: 0.5
      }
    },
    {
      id: 'default-cyclone-1',
      type: 'cyclone',
      position: { lat: 18.5, lng: 87.0 },
      radius: 120,
      intensity: 8,
      name: 'Cyclone Zone',
      description: 'Severe tropical storm with high winds and heavy rain.',
      impact: {
        waveHeight: 12,
        windSpeed: 40,
        currentSpeed: 10,
        visibility: 1
      }
    }
  ];
}

/**
 * Calculate alternative route that slightly deviates from original path to avoid weather
 */
export const calculateAlternativeRoute = (
  originalRoute: Position[],
  weatherConditions: ExtremeWeatherCondition[],
  deviationIndex: number = 0,
  routeId: number = 1
): AlternativeRoute => {
  if (originalRoute.length < 2) {
    throw new Error('Route must have at least 2 points');
  }
  
  // Create waypoints by slightly deviating from original route only where necessary
  const waypoints: Position[] = [];
  
  for (let i = 0; i < originalRoute.length; i++) {
    const originalPoint = originalRoute[i];
    let newPoint = { ...originalPoint };
    
    // Check if this point or nearby segment is affected by weather
    const isInWeather = isPointInExtremeWeather(originalPoint, weatherConditions);
    const needsDeviation = isInWeather || isSegmentAffectedByWeather(
      originalRoute, i, weatherConditions
    );
    
    if (needsDeviation && i > 0 && i < originalRoute.length - 1) {
      // Calculate minimal deviation to avoid weather while maintaining fuel efficiency
      const deviation = calculateMinimalDeviation(
        originalPoint,
        originalRoute[i - 1],
        originalRoute[i + 1],
        weatherConditions,
        deviationIndex
      );
      
      newPoint.lat += deviation.latOffset;
      newPoint.lng += deviation.lngOffset;
    }
    
    waypoints.push(newPoint);
  }
  
/**
 * Check if a route segment is affected by weather conditions
 */
function isSegmentAffectedByWeather(
  route: Position[],
  pointIndex: number,
  weatherConditions: ExtremeWeatherCondition[]
): boolean {
  // Check the segment before and after the current point
  const checkRadius = 2; // Check 2 points before and after
  const startIdx = Math.max(0, pointIndex - checkRadius);
  const endIdx = Math.min(route.length - 1, pointIndex + checkRadius);
  
  for (let i = startIdx; i <= endIdx; i++) {
    if (isPointInExtremeWeather(route[i], weatherConditions)) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate minimal deviation from original path to avoid weather
 */
function calculateMinimalDeviation(
  currentPoint: Position,
  prevPoint: Position,
  nextPoint: Position,
  weatherConditions: ExtremeWeatherCondition[],
  deviationIndex: number
): { latOffset: number; lngOffset: number } {
  // Find the closest weather condition affecting this point
  let closestWeather: ExtremeWeatherCondition | null = null;
  let minDistance = Infinity;
  
  for (const weather of weatherConditions) {
    const distance = Math.sqrt(
      Math.pow(currentPoint.lat - weather.position.lat, 2) +
      Math.pow(currentPoint.lng - weather.position.lng, 2)
    );
    const weatherRadiusDegrees = weather.radius / 111; // Convert km to degrees (approx)
    
    if (distance < weatherRadiusDegrees && distance < minDistance) {
      closestWeather = weather;
      minDistance = distance;
    }
  }
  
  if (!closestWeather) {
    return { latOffset: 0, lngOffset: 0 };
  }
  
  // Calculate direction vector of the original route
  const routeDirection = {
    lat: nextPoint.lat - prevPoint.lat,
    lng: nextPoint.lng - prevPoint.lng
  };
  
  // Calculate direction away from weather center
  const weatherDirection = {
    lat: currentPoint.lat - closestWeather.position.lat,
    lng: currentPoint.lng - closestWeather.position.lng
  };
  
  // Normalize weather direction
  const weatherDistance = Math.sqrt(
    weatherDirection.lat * weatherDirection.lat +
    weatherDirection.lng * weatherDirection.lng
  );
  
  if (weatherDistance === 0) {
    // If directly on weather center, use perpendicular to route
    const routeLength = Math.sqrt(
      routeDirection.lat * routeDirection.lat +
      routeDirection.lng * routeDirection.lng
    );
    if (routeLength > 0) {
      return {
        latOffset: (-routeDirection.lng / routeLength) * 0.1 * (deviationIndex + 1),
        lngOffset: (routeDirection.lat / routeLength) * 0.1 * (deviationIndex + 1)
      };
    }
  }
  
  // Calculate minimal deviation that balances weather avoidance and fuel efficiency
  const safetyBuffer = 1.2; // 20% buffer beyond weather radius
  const weatherRadiusDegrees = (closestWeather.radius / 111) * safetyBuffer;
  const requiredDistance = weatherRadiusDegrees - minDistance;
  
  if (requiredDistance <= 0) {
    return { latOffset: 0, lngOffset: 0 };
  }
  
  // Create deviation that's proportional to weather intensity and route alternatives
  const deviationMagnitude = requiredDistance + (0.05 * deviationIndex);
  const normalizedWeatherDir = {
    lat: weatherDirection.lat / weatherDistance,
    lng: weatherDirection.lng / weatherDistance
  };
  
  // Add slight perpendicular component for different alternative routes
  const perpendicular = {
    lat: -normalizedWeatherDir.lng,
    lng: normalizedWeatherDir.lat
  };
  
  const perpWeight = 0.3 * (deviationIndex % 2 === 0 ? 1 : -1);
  
  return {
    latOffset: normalizedWeatherDir.lat * deviationMagnitude + perpendicular.lat * perpWeight * deviationMagnitude,
    lngOffset: normalizedWeatherDir.lng * deviationMagnitude + perpendicular.lng * perpWeight * deviationMagnitude
  };
}
  
  // Calculate route metrics with focus on fuel efficiency
  let totalDistance = 0;
  let totalDeviation = 0;
  
  for (let i = 1; i < waypoints.length; i++) {
    const lat1 = waypoints[i - 1].lat;
    const lng1 = waypoints[i - 1].lng;
    const lat2 = waypoints[i].lat;
    const lng2 = waypoints[i].lng;
    
    // Haversine distance calculation
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = 6371 * c; // Earth's radius in km
    
    totalDistance += distance;
    
    // Calculate deviation from original route for fuel efficiency assessment
    if (i < originalRoute.length) {
      const originalLat1 = originalRoute[i - 1].lat;
      const originalLng1 = originalRoute[i - 1].lng;
      const originalLat2 = originalRoute[i].lat;
      const originalLng2 = originalRoute[i].lng;
      
      const originalDLat = (originalLat2 - originalLat1) * Math.PI / 180;
      const originalDLng = (originalLng2 - originalLng1) * Math.PI / 180;
      const originalA = Math.sin(originalDLat/2) * Math.sin(originalDLat/2) +
                       Math.cos(originalLat1 * Math.PI / 180) * Math.cos(originalLat2 * Math.PI / 180) *
                       Math.sin(originalDLng/2) * Math.sin(originalDLng/2);
      const originalC = 2 * Math.atan2(Math.sqrt(originalA), Math.sqrt(1-originalA));
      const originalDistance = 6371 * originalC;
      
      totalDeviation += Math.abs(distance - originalDistance);
    }
  }
  
  // Calculate fuel efficiency based on minimal deviation
  const deviationRatio = totalDeviation / totalDistance;
  const fuelEfficiencyFactor = 1 + (deviationRatio * 0.15); // 15% max fuel increase for deviations
  const durationHours = totalDistance / 20; // Slightly slower due to weather avoidance
  const nauticalMiles = totalDistance * 0.54; // Convert km to nautical miles
  
  // Calculate safety score based on weather avoidance and route efficiency
  const affectedPoints = waypoints.filter(point => 
    isPointInExtremeWeather(point, weatherConditions)
  );
  const weatherAvoidanceScore = Math.max(0, 10 - (affectedPoints.length / waypoints.length) * 10);
  const efficiencyScore = Math.max(0, 10 - (deviationRatio * 20));
  const safetyScore = (weatherAvoidanceScore * 0.7) + (efficiencyScore * 0.3);
  
  return {
    id: `efficient-alt-${routeId}-${Date.now()}`,
    waypoints,
    distance: nauticalMiles,
    duration: durationHours,
    fuelConsumption: (totalDistance * 0.12) * fuelEfficiencyFactor, // Fuel-efficient calculation
    safetyScore: Math.round(safetyScore * 10) / 10,
    weatherConditions: affectedPoints.length > 0 ? ['light'] : ['clear'],
    originalRouteId: 'original-route'
  };
};

/**
 * Get fuel-efficient alternative routes that slightly deviate to avoid weather
 */
export const getAlternativeRoutes = (
  originalRoute: Position[],
  count: number = 3,
  weatherConditions?: ExtremeWeatherCondition[]
): AlternativeRoute[] => {
  // Use provided weather conditions or generate new ones
  const weather = weatherConditions || getExtremeWeatherConditions(originalRoute);
  
  return Array.from({ length: count }, (_, i) => {
    // Generate different deviation patterns for each alternative
    return calculateAlternativeRoute(originalRoute, weather, i, i + 1);
  });
};

/**
 * Check if a point is affected by extreme weather
 */
export const isPointInExtremeWeather = (
  point: { lat: number; lng: number },
  weatherConditions: ExtremeWeatherCondition[]
): boolean => {
  const pt = turf.point([point.lng, point.lat]);
  
  return weatherConditions.some(condition => {
    const center = [condition.position.lng, condition.position.lat] as [number, number];
    const radiusKm = condition.radius;
    
    // Create a circle for the weather condition
    const circle = turf.circle(center, radiusKm, {
      steps: 64,
      units: 'kilometers',
      properties: {}
    });
    
    return turf.booleanPointInPolygon(pt, circle);
  });
};

/**
 * Get weather impact on route
 */
export const getRouteWeatherImpact = (
  route: Position[],
  weatherConditions: ExtremeWeatherCondition[]
): { severity: 'low' | 'medium' | 'high'; message: string } => {
  const affectedPoints = route.filter(point => 
    isPointInExtremeWeather(point, weatherConditions)
  );
  
  const impactRatio = affectedPoints.length / route.length;
  
  if (impactRatio > 0.3) {
    return {
      severity: 'high',
      message: 'Severe weather conditions detected. Consider alternative routes.'
    };
  } else if (impactRatio > 0.1) {
    return {
      severity: 'medium',
      message: 'Moderate weather conditions detected. Exercise caution.'
    };
  }
  
  return {
    severity: 'low',
    message: 'Favorable weather conditions.'
  };
};
