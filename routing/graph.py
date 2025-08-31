from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple, Iterable

import networkx as nx


Coordinate = Tuple[float, float]


@dataclass(frozen=True)
class Port:
    name: str
    coord: Coordinate


def build_graph(ports: Iterable[Port]) -> nx.Graph:
    graph = nx.Graph()
    for port in ports:
        graph.add_node(port.name, coord=port.coord)
    # Simple full mesh as placeholder; real logic would restrict to sea lanes
    names = [p.name for p in ports]
    for i, a in enumerate(names):
        for b in names[i + 1 :]:
            graph.add_edge(a, b, distance=haversine_km(graph.nodes[a]["coord"], graph.nodes[b]["coord"]))
    return graph


def haversine_km(a: Coordinate, b: Coordinate) -> float:
    from math import radians, sin, cos, sqrt, atan2

    lat1, lon1 = a
    lat2, lon2 = b
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    x = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * atan2(sqrt(x), sqrt(1 - x))


