from dash import Dash, html, dcc, Input, Output, State
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

from routing.graph import Port, build_graph
from routing.pathfinding import fastest_path, safest_path, recommended_path
from weather.simulation import simulate_weather


def create_app() -> Dash:
    app = Dash(__name__)

    # Placeholder gauges
    speed_gauge = go.Figure(go.Indicator(mode="gauge+number", value=12, title={"text": "Speed (kn)"}))
    temp_gauge = go.Figure(go.Indicator(mode="gauge+number", value=22, title={"text": "Temp (°C)"}))
    pressure_gauge = go.Figure(go.Indicator(mode="gauge+number", value=1013, title={"text": "Pressure (hPa)"}))

    app.layout = html.Div(
        [
            html.Div(
                [
                    dcc.Graph(figure=speed_gauge, id="gauge-speed"),
                    dcc.Graph(figure=temp_gauge, id="gauge-temp"),
                    dcc.Graph(figure=pressure_gauge, id="gauge-pressure"),
                ],
                style={"display": "flex", "gap": "12px"},
            ),
            html.Div(
                [
                    html.Div(
                        [
                            html.H4("Route Controls"),
                            dcc.Input(id="start-lat", type="number", placeholder="Start Lat"),
                            dcc.Input(id="start-lon", type="number", placeholder="Start Lon"),
                            dcc.Input(id="end-lat", type="number", placeholder="End Lat"),
                            dcc.Input(id="end-lon", type="number", placeholder="End Lon"),
                            dcc.Dropdown(
                                id="path-type",
                                options=[
                                    {"label": "Fastest", "value": "fastest"},
                                    {"label": "Safest", "value": "safest"},
                                    {"label": "Recommended", "value": "recommended"},
                                ],
                                value="recommended",
                                clearable=False,
                                style={"marginTop": "8px"},
                            ),
                            html.Button("Compute Route", id="compute-route"),
                        ],
                        style={"width": "20%"},
                    ),
                    html.Div(
                        [
                            dcc.Graph(id="world-map"),
                        ],
                        style={"flex": 1},
                    ),
                ],
                style={"display": "flex", "gap": "12px", "marginTop": "12px"},
            ),
            html.Div([html.H4("Weather Summary"), html.Div(id="weather-summary")], style={"marginTop": "12px"}),
        ]
    )

    # Sample ports to form a tiny mesh; real app would load from DB/GeoJSON
    sample_ports = [
        Port("Start", (0.0, 0.0)),
        Port("MidA", (10.0, 15.0)),
        Port("MidB", (5.0, 30.0)),
        Port("End", (20.0, 40.0)),
    ]
    base_graph = build_graph(sample_ports)

    def risk_metric(u, v, data):
        # Toy risk driven by longitude; replace with weather/hazard overlays
        return max(0.0, (base_graph.nodes[u]["coord"][1] + base_graph.nodes[v]["coord"][1]) / 100.0)

    @app.callback(
        Output("world-map", "figure"),
        Output("gauge-speed", "figure"),
        Output("gauge-temp", "figure"),
        Output("gauge-pressure", "figure"),
        Output("weather-summary", "children"),
        Input("compute-route", "n_clicks"),
        State("start-lat", "value"),
        State("start-lon", "value"),
        State("end-lat", "value"),
        State("end-lon", "value"),
        State("path-type", "value"),
        prevent_initial_call=True,
    )
    def on_compute(_, s_lat, s_lon, e_lat, e_lon, path_type):
        # Build ad-hoc graph from inputs + existing mesh
        ports = [
            Port("S", (float(s_lat), float(s_lon))),
            Port("A", (10.0, 15.0)),
            Port("B", (5.0, 30.0)),
            Port("E", (float(e_lat), float(e_lon))),
        ]
        graph = build_graph(ports)

        if path_type == "fastest":
            nodes = fastest_path(graph, "S", "E")
        elif path_type == "safest":
            nodes = safest_path(graph, "S", "E", risk_metric)
        else:
            nodes = recommended_path(graph, "S", "E", risk_metric, alpha=0.5)

        coords = [graph.nodes[n]["coord"] for n in nodes]
        lats, lons = zip(*coords)

        fig = px.scatter_geo()
        fig.add_scattergeo(lat=lats, lon=lons, mode="lines+markers", line=dict(width=3))
        fig.update_layout(geo=dict(showland=True), margin=dict(l=0, r=0, t=0, b=0))

        # Simulate weather along path and update gauges
        mid_idx = max(0, len(coords) // 2 - 1)
        w = simulate_weather(coords[mid_idx], t=0.0)

        speed_fig = go.Figure(go.Indicator(mode="gauge+number", value=max(0, 20 - w.wind_ms), title={"text": "Speed (kn)"}))
        temp_fig = go.Figure(go.Indicator(mode="gauge+number", value=w.temperature_c, title={"text": "Temp (°C)"}))
        pressure_fig = go.Figure(go.Indicator(mode="gauge+number", value=w.pressure_hpa, title={"text": "Pressure (hPa)"}))

        summary = f"Segments: {len(nodes)-1} | Wind: {w.wind_ms:.1f} m/s | Rain: {w.rainfall_mm_h:.1f} mm/h"
        return fig, speed_fig, temp_fig, pressure_fig, summary

    return app


if __name__ == "__main__":
    app = create_app()
    app.run_server(debug=True)


