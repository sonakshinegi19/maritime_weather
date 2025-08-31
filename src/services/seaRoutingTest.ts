import { findSeaRoute, SeaNode } from './seaRouting';

const start: SeaNode = { lat: 19.076, lng: 72.8777 }; // Mumbai
const end: SeaNode = { lat: 1.3521, lng: 103.8198 }; // Singapore

console.log('Calculating maritime route from Mumbai to Singapore...');
const route = findSeaRoute(start, end, 0, 25, 70, 105, 1); // Adjust bounds/step for your region
console.log('Computed route:', route);
