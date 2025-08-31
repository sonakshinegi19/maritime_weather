from __future__ import annotations

from typing import List, Tuple

import networkx as nx


def fastest_path(graph: nx.Graph, start: str, end: str) -> List[str]:
    return nx.shortest_path(graph, start, end, weight="distance")


def safest_path(graph: nx.Graph, start: str, end: str, risk_func) -> List[str]:
    g = graph.copy()
    for u, v, data in g.edges(data=True):
        distance = data.get("distance", 1.0)
        risk = risk_func(u, v, data)
        data["risk_cost"] = distance * (1.0 + risk)
    return nx.shortest_path(g, start, end, weight="risk_cost")


def recommended_path(graph: nx.Graph, start: str, end: str, risk_func, alpha: float = 0.5) -> List[str]:
    g = graph.copy()
    for u, v, data in g.edges(data=True):
        distance = data.get("distance", 1.0)
        risk = risk_func(u, v, data)
        data["combo_cost"] = alpha * distance + (1 - alpha) * distance * (1.0 + risk)
    return nx.shortest_path(g, start, end, weight="combo_cost")


