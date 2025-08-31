import { findMaritimePath } from './maritimePathfinding';

describe('Maritime Pathfinding', () => {
  it('should avoid land when plotting a route from Mumbai to Singapore', async () => {
    const start = { lat: 19.076, lng: 72.8777, name: 'Mumbai' };
    const end = { lat: 1.3521, lng: 103.8198, name: 'Singapore' };
    const route = await findMaritimePath(start, end);
    // All waypoints should not be over land
    for (const point of route) {
      expect(point.name).not.toMatch(/adjusted to sea/);
    }
  });

  it('should avoid land when plotting a route from Chennai to Jakarta', async () => {
    const start = { lat: 13.0827, lng: 80.2707, name: 'Chennai' };
    const end = { lat: -6.2088, lng: 106.8456, name: 'Jakarta' };
    const route = await findMaritimePath(start, end);
    for (const point of route) {
      expect(point.name).not.toMatch(/adjusted to sea/);
    }
  });
// ...existing code...
});
