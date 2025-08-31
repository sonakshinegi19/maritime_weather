import numpy as np
from typing import List, Tuple, Dict
from datetime import datetime, timedelta
import random

class WeatherSimulator:
    def __init__(self, seed: int = None):
        """Initialize the weather simulator with an optional seed for reproducibility."""
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
            
        # Initialize base weather patterns
        self.base_temperature = 20.0  # Base temperature in Celsius
        self.base_pressure = 1013.25  # Base pressure in hPa
        self.base_wind_speed = 5.0    # Base wind speed in m/s
        self.base_wave_height = 1.0   # Base wave height in meters
        
        # Weather patterns by region (lat, lon) -> weather params
        self.weather_patterns = {
            'tropical': {
                'temp_range': (25, 35),
                'pressure_range': (1000, 1015),
                'humidity_range': (70, 95),
                'wind_speed_range': (5, 30),  # Higher for tropical storms
                'precipitation_prob': 0.6,
                'storm_prob': 0.1
            },
            'temperate': {
                'temp_range': (5, 25),
                'pressure_range': (990, 1030),
                'humidity_range': (50, 85),
                'wind_speed_range': (2, 20),
                'precipitation_prob': 0.4,
                'storm_prob': 0.05
            },
            'polar': {
                'temp_range': (-30, 5),
                'pressure_range': (980, 1020),
                'humidity_range': (30, 70),
                'wind_speed_range': (10, 40),  # Higher due to katabatic winds
                'precipitation_prob': 0.3,
                'storm_prob': 0.15
            }
        }
    
    def _get_region_for_coords(self, lat: float, lon: float) -> str:
        """Determine the climate region based on latitude and longitude."""
        if abs(lat) < 23.5:
            return 'tropical'
        elif abs(lat) < 66.5:
            return 'temperate'
        else:
            return 'polar'
    
    def _generate_weather_params(self, region: str, time: datetime) -> Dict:
        """Generate base weather parameters for a given region and time."""
        pattern = self.weather_patterns[region]
        
        # Add seasonal variation
        day_of_year = time.timetuple().tm_yday
        seasonal_factor = np.sin(2 * np.pi * (day_of_year - 80) / 365)  # Peaks at summer solstice
        
        # Generate base values with some randomness
        temp = np.random.uniform(*pattern['temp_range'])
        temp += 10 * seasonal_factor  # Amplify seasonal effect
        
        # Add diurnal variation (colder at night)
        hour = time.hour
        diurnal_factor = np.cos(2 * np.pi * (hour - 14) / 24)  # Warmest at 2 PM
        temp += 5 * diurnal_factor
        
        pressure = np.random.uniform(*pattern['pressure_range'])
        humidity = np.random.uniform(*pattern['humidity_range'])
        
        # Generate wind speed with some correlation to pressure gradients
        base_wind = np.random.uniform(*pattern['wind_speed_range'])
        wind_speed = base_wind * (1 + 0.2 * np.random.normal())
        
        # Determine precipitation
        is_raining = np.random.random() < pattern['precipitation_prob']
        is_storm = is_raining and (np.random.random() < pattern['storm_prob'])
        
        if is_storm:
            # Storm conditions
            wind_speed *= 2.5
            pressure *= 0.95  # Lower pressure in storms
            precipitation = np.random.uniform(10, 50)  # mm/h
        elif is_raining:
            # Normal rain
            precipitation = np.random.uniform(1, 10)  # mm/h
        else:
            precipitation = 0
        
        # Calculate wave height based on wind speed and fetch
        fetch = 100  # km - simplified for this simulation
        wave_height = 0.0248 * (wind_speed ** 2) * (fetch ** 0.5) / 1000  # In meters
        
        return {
            'temperature': round(temp, 1),  # °C
            'pressure': round(pressure, 1),  # hPa
            'humidity': round(humidity),     # %
            'wind_speed': round(wind_speed, 1),  # m/s
            'wind_direction': np.random.uniform(0, 360),  # degrees
            'precipitation': round(precipitation, 1),  # mm/h
            'wave_height': round(wave_height, 1),  # m
            'conditions': self._get_conditions(is_raining, is_storm, wind_speed)
        }
    
    def _get_conditions(self, is_raining: bool, is_storm: bool, wind_speed: float) -> str:
        """Generate human-readable weather conditions."""
        if is_storm:
            return 'Stormy'
        elif is_raining:
            if wind_speed > 15:
                return 'Heavy Rain with Strong Winds'
            return 'Rainy'
        elif wind_speed > 10:
            return 'Windy'
        elif wind_speed > 5:
            return 'Breezy'
        else:
            return 'Clear'
    
    def get_weather_at_point(self, lat: float, lon: float, time: datetime = None) -> Dict:
        """Get weather conditions at a specific point and time."""
        if time is None:
            time = datetime.utcnow()
            
        region = self._get_region_for_coords(lat, lon)
        weather = self._generate_weather_params(region, time)
        
        # Add location-specific variations
        weather.update({
            'latitude': lat,
            'longitude': lon,
            'timestamp': time.isoformat(),
            'region': region
        })
        
        return weather
    
    def get_weather_along_route(self, 
                              coordinates: List[Tuple[float, float]], 
                              start_time: datetime = None,
                              speed_knots: float = 20.0) -> List[Dict]:
        """
        Get weather conditions along a route over time.
        
        Args:
            coordinates: List of (lat, lon) points along the route
            start_time: Start time of the journey (default: now)
            speed_knots: Average speed in knots (1 knot = 1.852 km/h)
            
        Returns:
            List of weather observations along the route with timestamps
        """
        if start_time is None:
            start_time = datetime.utcnow()
            
        weather_data = []
        current_time = start_time
        
        # Calculate distances between points
        distances = []
        for i in range(len(coordinates) - 1):
            dist = self._haversine(coordinates[i], coordinates[i+1])
            distances.append(dist)
        
        total_distance = sum(distances)
        total_hours = total_distance / (speed_knots * 1.852)  # Convert knots to km/h
        
        # Sample points along the route
        num_samples = min(50, len(coordinates))  # Limit number of samples
        sample_indices = np.linspace(0, len(coordinates) - 1, num_samples, dtype=int)
        
        for i in sample_indices:
            if i >= len(coordinates):
                continue
                
            # Calculate time at this point
            distance_so_far = sum(distances[:i]) if i > 0 else 0
            time_elapsed = (distance_so_far / total_distance) * total_hours
            point_time = start_time + timedelta(hours=time_elapsed)
            
            # Get weather at this point and time
            lat, lon = coordinates[i]
            weather = self.get_weather_at_point(lat, lon, point_time)
            weather['distance_km'] = round(distance_so_far, 2)
            weather['time_elapsed_hours'] = round(time_elapsed, 2)
            
            weather_data.append(weather)
        
        return weather_data
    
    @staticmethod
    def _haversine(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate the great circle distance between two points in kilometers."""
        from math import radians, sin, cos, sqrt, atan2
        
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        radius_earth = 6371  # Radius of Earth in kilometers
        
        return radius_earth * c
