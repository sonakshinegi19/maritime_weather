"""
Utility functions for the Maritime Weather Dashboard.
"""
from typing import List, Tuple, Dict, Any
import json
import os


def parse_coordinates(coord_str: str) -> Tuple[float, float]:
    """
    Parse a coordinate string in the format 'lat,lon' or 'lat, lon' into a tuple of floats.
    
    Args:
        coord_str: String containing latitude and longitude separated by comma
        
    Returns:
        Tuple of (latitude, longitude) as floats
        
    Raises:
        ValueError: If the input string cannot be parsed into valid coordinates
    """
    try:
        # Remove any whitespace and split by comma
        parts = [p.strip() for p in coord_str.split(',')]
        if len(parts) != 2:
            raise ValueError("Coordinate string must contain exactly one comma")
            
        lat, lon = map(float, parts)
        
        # Basic validation
        if not (-90 <= lat <= 90):
            raise ValueError(f"Latitude must be between -90 and 90, got {lat}")
        if not (-180 <= lon <= 180):
            raise ValueError(f"Longitude must be between -180 and 180, got {lon}")
            
        return lat, lon
        
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid coordinate format: {coord_str}. Expected 'lat,lon' (e.g., '40.7128,-74.0060')") from e


def parse_waypoints(waypoints_str: str) -> List[Tuple[float, float]]:
    """
    Parse a string containing multiple waypoints into a list of coordinate tuples.
    
    Args:
        waypoints_str: String containing waypoints, one per line, each in 'lat,lon' format
        
    Returns:
        List of (lat, lon) tuples
    """
    if not waypoints_str or not waypoints_str.strip():
        return []
        
    waypoints = []
    for line in waypoints_str.strip().split('\n'):
        line = line.strip()
        if line:  # Skip empty lines
            waypoints.append(parse_coordinates(line))
            
    return waypoints


def calculate_bounding_box(coordinates: List[Tuple[float, float]], padding: float = 0.1) -> Dict[str, float]:
    """
    Calculate a bounding box that contains all the given coordinates.
    
    Args:
        coordinates: List of (lat, lon) tuples
        padding: Padding to add around the points (in degrees)
        
    Returns:
        Dictionary with 'north', 'south', 'east', 'west' bounds
    """
    if not coordinates:
        return {
            'north': 0,
            'south': 0,
            'east': 0,
            'west': 0
        }
        
    lats = [lat for lat, _ in coordinates]
    lons = [lon for _, lon in coordinates]
    
    return {
        'north': max(lats) + padding,
        'south': min(lats) - padding,
        'east': max(lons) + padding,
        'west': min(lons) - padding
    }


def create_folium_map(coordinates: List[Tuple[float, float]], 
                     path_type: str = 'recommended') -> str:
    """
    Create a Folium map with the given route and return it as HTML.
    
    Args:
        coordinates: List of (lat, lon) points along the route
        path_type: Type of path ('fastest', 'safest', 'recommended')
        
    Returns:
        HTML string containing the map
    """
    import folium
    from folium.plugins import Draw, MeasureControl, Fullscreen, MarkerCluster
    
    if not coordinates:
        # Default view if no coordinates
        m = folium.Map(location=[20, 0], zoom_start=2, tiles='OpenStreetMap')
    else:
        # Calculate map center and bounds
        bbox = calculate_bounding_box(coordinates)
        center_lat = (bbox['north'] + bbox['south']) / 2
        center_lon = (bbox['east'] + bbox['west']) / 2
        
        # Create map
        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=4,
            tiles='OpenStreetMap',
            control_scale=True
        )
        
        # Add route line
        if len(coordinates) > 1:
            # Choose color based on path type
            color_map = {
                'fastest': 'red',
                'safest': 'green',
                'recommended': 'blue'
            }
            color = color_map.get(path_type, 'blue')
            
            # Add the route line
            folium.PolyLine(
                coordinates,
                color=color,
                weight=5,
                opacity=0.8,
                popup=f"{path_type.capitalize()} Route"
            ).add_to(m)
            
            # Add start and end markers
            start_lat, start_lon = coordinates[0]
            end_lat, end_lon = coordinates[-1]
            
            folium.Marker(
                [start_lat, start_lon],
                popup='Start',
                icon=folium.Icon(color='green', icon='ship', prefix='fa')
            ).add_to(m)
            
            folium.Marker(
                [end_lat, end_lon],
                popup='End',
                icon=folium.Icon(color='red', icon='anchor', prefix='fa')
            ).add_to(m)
            
            # Add waypoint markers
            for i, (lat, lon) in enumerate(coordinates[1:-1], 1):
                folium.Marker(
                    [lat, lon],
                    popup=f'Waypoint {i}',
                    icon=folium.Icon(color='blue', icon='map-marker', prefix='fa')
                ).add_to(m)
    
    # Add controls
    Draw(export=True).add_to(m)
    MeasureControl().add_to(m)
    Fullscreen().add_to(m)
    
    # Add tile layers
    folium.TileLayer('Stamen Terrain').add_to(m)
    folium.TileLayer('Stamen Toner').add_to(m)
    folium.TileLayer('OpenSeaMap').add_to(m)
    folium.LayerControl().add_to(m)
    
    # Add a minimap
    from folium.plugins import MiniMap
    minimap = MiniMap()
    m.add_child(minimap)
    
    # Return the map as HTML
    return m._repr_html_()


def save_route_to_file(route_data: Dict[str, Any], filename: str = None) -> str:
    """
    Save route data to a JSON file.
    
    Args:
        route_data: Dictionary containing route information
        filename: Optional filename (will generate one if not provided)
        
    Returns:
        Path to the saved file
    """
    # Create data directory if it doesn't exist
    os.makedirs('data/routes', exist_ok=True)
    
    # Generate filename if not provided
    if not filename:
        import datetime
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'route_{timestamp}.json'
    
    # Ensure .json extension
    if not filename.endswith('.json'):
        filename += '.json'
    
    # Save to file
    filepath = os.path.join('data', 'routes', filename)
    with open(filepath, 'w') as f:
        json.dump(route_data, f, indent=2)
        
    return filepath


def load_route_from_file(filepath: str) -> Dict[str, Any]:
    """
    Load route data from a JSON file.
    
    Args:
        filepath: Path to the JSON file
        
    Returns:
        Dictionary containing the route data
    """
    with open(filepath, 'r') as f:
        return json.load(f)


def format_weather_summary(weather_data: Dict) -> str:
    """
    Format weather data into a human-readable summary.
    
    Args:
        weather_data: Dictionary containing weather information
        
    Returns:
        Formatted HTML string with weather summary
    """
    if not weather_data:
        return "No weather data available."
        
    # Get the most recent weather observation if it's a list
    if isinstance(weather_data, list):
        if not weather_data:
            return "No weather data available."
        weather = weather_data[-1]  # Get the latest observation
    else:
        weather = weather_data
    
    # Format the summary
    summary = [
        f"**Temperature:** {weather.get('temperature', 'N/A')}°C",
        f"**Conditions:** {weather.get('conditions', 'N/A')}",
        f"**Wind:** {weather.get('wind_speed', 'N/A')} m/s from {weather.get('wind_direction', 'N/A')}°",
        f"**Pressure:** {weather.get('pressure', 'N/A')} hPa",
        f"**Humidity:** {weather.get('humidity', 'N/A')}%",
        f"**Wave Height:** {weather.get('wave_height', 'N/A')} m"
    ]
    
    # Add precipitation if it's raining
    if weather.get('precipitation', 0) > 0:
        summary.append(f"**Precipitation:** {weather['precipitation']} mm/h")
    
    # Add region information if available
    if 'region' in weather:
        summary.append(f"**Region:** {weather['region'].capitalize()}")
    
    # Add timestamp if available
    if 'timestamp' in weather:
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(weather['timestamp'].replace('Z', '+00:00'))
            summary.append(f"**Last Updated:** {dt.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        except (ValueError, AttributeError):
            pass
    
    return "  \n".join(summary)
