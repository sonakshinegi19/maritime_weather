export interface ExtremeWeatherCondition {
  id: string;
  type: 'tsunami' | 'storm' | 'high_tide' | 'cyclone';
  position: {
    lat: number;
    lng: number;
  };
  radius: number; // in kilometers
  intensity: number; // 1-10 scale
  name: string;
  description: string;
  impact: {
    waveHeight: number; // in meters
    windSpeed: number; // in m/s
    currentSpeed: number; // in knots
    visibility: number; // in kilometers
  };
}

export interface AlternativeRoute {
  id: string;
  waypoints: Array<{ lat: number; lng: number }>;
  distance: number; // in nautical miles
  duration: number; // in hours
  fuelConsumption: number; // in tons
  safetyScore: number; // 1-10 scale
  weatherConditions: string[];
  originalRouteId: string;
}

export const EXTREME_WEATHER_CONDITIONS: ExtremeWeatherCondition[] = [
  {
    id: 'tsunami-1',
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
    id: 'cyclone-1',
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
  },
  {
    id: 'storm-1',
    type: 'storm',
    position: { lat: 12.0, lng: 77.0 },
    radius: 80,
    intensity: 7,
    name: 'Severe Storm Area',
    description: 'Heavy rain and strong winds. Reduced visibility.',
    impact: {
      waveHeight: 8,
      windSpeed: 25,
      currentSpeed: 8,
      visibility: 2
    }
  }
];
