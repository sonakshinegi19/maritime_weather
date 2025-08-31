import dash
from dash import dcc, html, Input, Output, State, callback
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import folium
from folium.plugins import Draw
import numpy as np
import pandas as pd
from pathlib import Path
import sys
import os
import json
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional, Union

# Add project root to path
project_root = str(Path(__file__).parent.absolute())
if project_root not in sys.path:
    sys.path.append(project_root)

# Import local modules
from routing.pathfinder import MaritimePathFinder
from routing.predefined_routes import get_predefined_route, list_predefined_routes
from weather.simulator import WeatherSimulator
from utils import create_folium_map, format_weather_summary, parse_coordinates, parse_waypoints

# Initialize services
path_finder = MaritimePathFinder()
weather_simulator = WeatherSimulator(seed=42)

# Ensure data directory exists
os.makedirs('data', exist_ok=True)
os.makedirs('data/routes', exist_ok=True)

# Initialize the Dash app
app = dash.Dash(
    __name__, 
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ]
)
server = app.server

# Default coordinates for initial map view
DEFAULT_COORDS = [(40.7128, -74.0060), (51.5074, -0.1278)]  # NY to London

# App layout
app.layout = dbc.Container([
    # Title
    dbc.Row([
        html.H1("Maritime Weather Dashboard", className="text-center my-4")
    ]),
    
    # Top Section: Ship Instruments
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Ship Instruments"),
                dbc.CardBody([
                    dbc.Row([
                        # Speed Gauge
                        dbc.Col([
                            dcc.Graph(
                                id='speed-gauge',
                                figure={
                                    'data': [go.Indicator(
                                        mode="gauge+number",
                                        value=0,
                                        domain={'x': [0, 1], 'y': [0, 1]},
                                        title={'text': "Speed (knots)"},
                                        gauge={
                                            'axis': {'range': [0, 30]},
                                            'bar': {'color': "darkblue"},
                                            'steps': [
                                                {'range': [0, 10], 'color': "lightgreen"},
                                                {'range': [10, 20], 'color': "yellow"},
                                                {'range': [20, 30], 'color': "red"}
                                            ]
                                        }
                                    )]
                                }
                            )
                        ], md=4),
                        
                        # Wind Gauge
                        dbc.Col([
                            dcc.Graph(
                                id='wind-gauge',
                                figure={
                                    'data': [go.Indicator(
                                        mode="gauge+number",
                                        value=0,
                                        domain={'x': [0, 1], 'y': [0, 1]},
                                        title={'text': "Wind Speed (m/s)"},
                                        gauge={
                                            'axis': {'range': [0, 40]},
                                            'bar': {'color': "darkblue"},
                                            'steps': [
                                                {'range': [0, 10], 'color': "lightblue"},
                                                {'range': [10, 25], 'color': "yellow"},
                                                {'range': [25, 40], 'color': "red"}
                                            ]
                                        }
                                    )]
                                }
                            )
                        ], md=4),
                        
                        # Wave Height Gauge
                        dbc.Col([
                            dcc.Graph(
                                id='wave-gauge',
                                figure={
                                    'data': [go.Indicator(
                                        mode="gauge+number",
                                        value=0,
                                        domain={'x': [0, 1], 'y': [0, 1]},
                                        title={'text': "Wave Height (m)"},
                                        gauge={
                                            'axis': {'range': [0, 10]},
                                            'bar': {'color': "darkblue"},
                                            'steps': [
                                                {'range': [0, 2], 'color': "lightblue"},
                                                {'range': [2, 5], 'color': "yellow"},
                                                {'range': [5, 10], 'color': "red"}
                                            ]
                                        }
                                    )]
                                }
                            )
                        ], md=4)
                    ])
                ])
            ])
        ])
    ], className='mb-4'),
    
    # Middle Section: Map and Controls
    dbc.Row([
        # Map Column
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Interactive Map"),
                dbc.CardBody([
                    html.Iframe(
                        id='map', 
                        style={
                            'width': '100%', 
                            'height': '500px',
                            'border': '1px solid #ddd',
                            'borderRadius': '4px'
                        }
                    )
                ])
            ])
        ], lg=8),
        
        # Controls Column
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Route Planning"),
                dbc.CardBody([
                    dbc.Form([
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("Route Selection"),
                                dcc.Dropdown(
                                    id='predefined-route',
                                    options=[
                                        {'label': name, 'value': route_id} 
                                        for route_id, name in list_predefined_routes().items()
                                    ],
                                    placeholder='Select a predefined route',
                                    clearable=True
                                ),
                            ])
                        ], className='mb-3'),
                        
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("Start Port"),
                                dbc.Input(
                                    id='start-port', 
                                    type='text', 
                                    placeholder="e.g., 40.7128, -74.0060",
                                    className="mb-2"
                                )
                            ])
                        ], className='mb-3'),
                        
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("End Port"),
                                dbc.Input(
                                    id='end-port', 
                                    type='text', 
                                    placeholder="e.g., 51.5074, 0.1278",
                                    className="mb-2"
                                )
                            ])
                        ], className='mb-3'),
                        
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("Waypoints"),
                                dbc.Textarea(
                                    id='waypoints', 
                                    placeholder="lat1,lon1\nlat2,lon2",
                                    className="mb-2",
                                    style={'height': '100px'}
                                )
                            ])
                        ], className='mb-3'),
                        
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("Route Type"),
                                dbc.Select(
                                    id='route-type',
                                    options=[
                                        {'label': 'Fastest Route', 'value': 'fastest'},
                                        {'label': 'Safest Route', 'value': 'safest'},
                                        {'label': 'Recommended Route', 'value': 'recommended'}
                                    ],
                                    value='recommended',
                                    className="mb-2"
                                )
                            ])
                        ], className='mb-3'),
                        
                        dbc.Row([
                            dbc.Col([
                                dbc.Button(
                                    "Calculate Route", 
                                    id='calculate-route', 
                                    color="primary", 
                                    className="w-100"
                                )
                            ])
                        ])
                    ])
                ])
            ])
        ], lg=4)
    ], className='mb-4'),
    
    # Bottom Section: Weather Summary and Route Info
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Weather Summary"),
                dbc.CardBody(id='weather-summary')
            ])
        ], lg=8),
        
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Route Information"),
                dbc.CardBody(id='route-info')
            ])
        ], lg=4)
    ]),
    
    # Hidden div to store intermediate values
    dcc.Store(id='route-data')
], fluid=True)

# Callbacks
@app.callback(
    Output('map', 'srcDoc'),
    [Input('calculate-route', 'n_clicks'),
     Input('predefined-route', 'value')],
    [State('start-port', 'value'),
     State('end-port', 'value'),
     State('waypoints', 'data'),
     State('route-type', 'value')]
)
def update_map(n_clicks, predefined_route, start_port, end_port, waypoints, route_type):
    """Update the map with the calculated route."""
    # Get the context to determine which input triggered the callback
    ctx = dash.callback_context
    if not ctx.triggered:
        return create_folium_map(DEFAULT_COORDS)
    
    triggered_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    # Handle predefined route selection
    if triggered_id == 'predefined-route' and predefined_route:
        route_data = get_predefined_route(predefined_route)
        if route_data and 'waypoints' in route_data and len(route_data['waypoints']) >= 2:
            waypoints_list = route_data['waypoints']
            start = waypoints_list[0]
            end = waypoints_list[-1]
            waypoints = waypoints_list[1:-1] if len(waypoints_list) > 2 else []
            
            # Update the start and end port inputs
            if dash.callback_context.outputs_list[0]['id'] == 'start-port':
                dash.callback_context.outputs_list[0]['value'] = f"{start[0]}, {start[1]}"
            if dash.callback_context.outputs_list[1]['id'] == 'end-port':
                dash.callback_context.outputs_list[1]['value'] = f"{end[0]}, {end[1]}"
        else:
            return create_folium_map(DEFAULT_COORDS)
    # Handle manual route calculation
    elif triggered_id == 'calculate-route':
        if not start_port or not end_port:
            return create_folium_map(DEFAULT_COORDS)
        try:
            start = parse_coordinates(start_port)
            end = parse_coordinates(end_port)
            waypoints = parse_waypoints(waypoints) if waypoints else []
        except ValueError as e:
            return create_folium_map(DEFAULT_COORDS)
    else:
        return create_folium_map(DEFAULT_COORDS)
    
    # Parse waypoints if any
    waypoint_list = waypoints if isinstance(waypoints, list) else (parse_waypoints(waypoints) if waypoints else [])
    
    try:
        # Calculate route
        route = path_finder.find_path(start, end, waypoint_list, path_type=route_type if route_type else 'optimal')
        
        # Get weather along the route
        weather_data = weather_simulator.get_weather_along_route(route['path'])
        
        # Save route data
        route_data = {
            'start': start,
            'end': end,
            'waypoints': waypoint_list,
            'path': route['path'],
            'distance': route['distance'],
            'weather': weather_data
        }
        
        # Create map with route and waypoints
        m = create_folium_map([start, end])
        
        # Add route to map
        folium.PolyLine(
            locations=route['path'],
            color='#1E88E5',
            weight=4,
            opacity=0.8
        ).add_to(m)
        
        # Add start and end markers
        folium.Marker(
            location=start,
            popup=f"Start: {start[0]:.4f}, {start[1]:.4f}",
            icon=folium.Icon(color='green', icon='ship', prefix='fa')
        ).add_to(m)
        
        folium.Marker(
            location=end,
            popup=f"End: {end[0]:.4f}, {end[1]:.4f}",
            icon=folium.Icon(color='red', icon='anchor', prefix='fa')
        ).add_to(m)
        
        # Add waypoints if any
        for i, wp in enumerate(waypoint_list, 1):
            folium.Marker(
                location=wp,
                popup=f"Waypoint {i}: {wp[0]:.4f}, {wp[1]:.4f}",
                icon=folium.Icon(color='blue', icon='map-marker-alt', prefix='fa')
            ).add_to(m)
        
        # Save route data to file
        save_route_to_file(route_data)
        
        # Update the route data store
        return m._repr_html_()
        
    except Exception as e:
        print(f"Error generating route: {str(e)}")
        return create_folium_map(DEFAULT_COORDS)

def update_gauges(speed=0, wind_speed=0, wave_height=0):
    """Update the gauge charts with new values."""
    return (
        update_speed_gauge(speed),
        update_wind_gauge(wind_speed),
        update_wave_gauge(wave_height)
    )

def save_route_to_file(route_data: Dict[str, Any]) -> str:
    """Save route data to a JSON file."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"route_{timestamp}.json"
    filepath = os.path.join('data', 'routes', filename)
    
    with open(filepath, 'w') as f:
        json.dump(route_data, f, indent=2)
    
    return filepath

@app.callback(
    Output('speed-gauge', 'figure'),
    [Input('map', 'srcDoc')]
)
def update_speed_gauge(_):
    """Update the speed gauge."""
    return {
        'data': [go.Indicator(
            mode="gauge+number",
            value=15,  # Default speed
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Speed (knots)"},
            gauge={
                'axis': {'range': [0, 30]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 10], 'color': "lightgreen"},
                    {'range': [10, 20], 'color': "yellow"},
                    {'range': [20, 30], 'color': "red"}
                ]
            }
        )]
    }

@app.callback(
    Output('wind-gauge', 'figure'),
    [Input('map', 'srcDoc')]
)
def update_wind_gauge(_):
    """Update the wind gauge."""
    return {
        'data': [go.Indicator(
            mode="gauge+number",
            value=0,  # Will be updated by route calculation
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Wind Speed (m/s)"},
            gauge={
                'axis': {'range': [0, 40]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 10], 'color': "lightblue"},
                    {'range': [10, 25], 'color': "yellow"},
                    {'range': [25, 40], 'color': "red"}
                ]
            }
        )]
    }

@app.callback(
    Output('wave-gauge', 'figure'),
    [Input('map', 'srcDoc')]
)
def update_wave_gauge(_):
    """Update the wave height gauge."""
    return {
        'data': [go.Indicator(
            mode="gauge+number",
            value=0,  # Will be updated by route calculation
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Wave Height (m)"},
            gauge={
                'axis': {'range': [0, 10]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 2], 'color': "lightblue"},
                    {'range': [2, 5], 'color': "yellow"},
                    {'range': [5, 10], 'color': "red"}
                ]
            }
        )]
    }

@app.callback(
    Output('weather-summary', 'children'),
    [Input('map', 'srcDoc')]
)
def update_weather_summary(_):
    """Update the weather summary."""
    return html.Div("Weather data will appear here after calculating a route.")

@app.callback(
    Output('route-info', 'children'),
    [Input('map', 'srcDoc')]
)
def update_route_info(_):
    """Update the route information."""
    return html.Div("Route information will appear here after calculating a route.")

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
