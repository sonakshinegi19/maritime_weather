from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple, Dict

import numpy as np


Coordinate = Tuple[float, float]


@dataclass
class WeatherSample:
    temperature_c: float
    wind_ms: float
    pressure_hpa: float
    rainfall_mm_h: float


def seed_rng(seed: int | None = None) -> np.random.Generator:
    return np.random.default_rng(seed)


def simulate_weather(coord: Coordinate, t: float, rng: np.random.Generator | None = None) -> WeatherSample:
    if rng is None:
        rng = seed_rng()
    lat, lon = coord
    base_temp = 27 - abs(lat) * 0.2 + 2 * np.sin(t / 6.0)
    temperature = base_temp + rng.normal(0, 0.8)
    wind = 8 + 4 * np.sin((lat + lon + t) / 10.0) + rng.normal(0, 1.0)
    pressure = 1013 + 6 * np.cos(t / 12.0) + rng.normal(0, 1.0)
    rainfall = max(0.0, rng.gamma(2.0, 0.6) - 0.8)
    return WeatherSample(temperature, max(0.0, wind), pressure, rainfall)


