import networkx as nx
import numpy as np
from typing import List, Tuple, Dict, Optional
from geopy.distance import geodesic

class MaritimePathFinder:
    def __init__(self):
        self.graph = nx.Graph()
        self.risk_zones = self._initialize_risk_zones()
        
    def _initialize_risk_zones(self) -> List[dict]:
        """Initialize predefined risk zones (can be extended with real data)."""
        return [
            {'coordinates': (20, -40), 'radius': 500, 'risk_level': 0.8},  # High risk zone
            {'coordinates': (10, -20), 'radius': 300, 'risk_level': 0.6},  # Medium risk zone
            {'coordinates': (30, -60), 'radius': 400, 'risk_level': 0.7}   # Another risk zone
        ]
    
    def calculate_risk(self, point: Tuple[float, float]) -> float:
        """Calculate risk level for a given point based on proximity to risk zones."""
        total_risk = 0.0
        for zone in self.risk_zones:
            distance = geodesic(point, zone['coordinates']).kilometers
            if distance < zone['radius']:
                # Inverse square law for risk attenuation
                risk = zone['risk_level'] * (1 - (distance / zone['radius']) ** 2)
                total_risk = max(total_risk, risk)
        return min(total_risk, 1.0)
    
    def create_route_network(self, points: List[Tuple[float, float]]) -> nx.Graph:
        """Create a network graph from the given points."""
        self.graph.clear()
        
        # Add nodes with position and risk data
        for i, (lat, lon) in enumerate(points):
            risk = self.calculate_risk((lat, lon))
            self.graph.add_node(i, pos=(lon, lat), risk=risk, lat=lat, lon=lon)
        
        # Add edges with weights based on distance and risk
        for i in range(len(points)):
            for j in range(i + 1, len(points)):
                pos_i = self.graph.nodes[i]['pos']
                pos_j = self.graph.nodes[j]['pos']
                
                # Calculate great circle distance in km
                distance = geodesic(points[i], points[j]).kilometers
                
                # Calculate average risk along the edge
                risk = (self.graph.nodes[i]['risk'] + self.graph.nodes[j]['risk']) / 2
                
                # Add edge with multiple weights
                self.graph.add_edge(
                    i, j,
                    distance=distance,
                    risk=risk,
                    # Combined score (lower is better)
                    fastest=distance,
                    safest=distance * (1 + risk * 5),  # Heavily penalize risk
                    recommended=distance * (1 + risk)   # Balance between speed and safety
                )
        
        return self.graph
    
    def find_path(self, 
                 start: Tuple[float, float], 
                 end: Tuple[float, float],
                 waypoints: Optional[List[Tuple[float, float]]] = None,
                 path_type: str = 'recommended') -> Dict:
        """
        Find the optimal path between two points with optional waypoints.
        
        Args:
            start: (lat, lon) of start point
            end: (lat, lon) of end point
            waypoints: List of (lat, lon) waypoints to include in the path
            path_type: Type of path to find ('fastest', 'safest', or 'recommended')
            
        Returns:
            Dictionary containing path details and statistics
        """
        if waypoints is None:
            waypoints = []
            
        # Combine all points (start, waypoints, end)
        all_points = [start] + waypoints + [end]
        
        # Create network and find path
        self.create_route_network(all_points)
        
        # Find shortest path based on selected metric
        weight_map = {
            'fastest': 'fastest',
            'safest': 'safest',
            'recommended': 'recommended'
        }
        
        try:
            node_path = nx.shortest_path(
                self.graph, 
                source=0,  # Start node
                target=len(all_points) - 1,  # End node
                weight=weight_map.get(path_type, 'recommended')
            )
            
            # Extract path coordinates and calculate statistics
            path_coords = [all_points[i] for i in node_path]
            total_distance = sum(
                self.graph.edges[node_path[i], node_path[i+1]]['distance']
                for i in range(len(node_path) - 1)
            )
            
            total_risk = sum(
                self.graph.edges[node_path[i], node_path[i+1]]['risk']
                for i in range(len(node_path) - 1)
            ) / max(1, len(node_path) - 1)
            
            return {
                'path': path_coords,
                'distance_km': total_distance,
                'average_risk': total_risk,
                'waypoints': waypoints,
                'path_type': path_type,
                'node_path': node_path
            }
            
        except nx.NetworkXNoPath:
            raise ValueError("No valid path found between the specified points")
