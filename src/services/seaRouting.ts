// @ts-ignore
const jsAstar = require('js-astar');
import { point, lineString, booleanPointInPolygon, booleanIntersects } from '@turf/turf';
// @ts-ignore
const landPolygons = require('./landPolygons.geojson');

export interface SeaNode {
  lat: number;
  lng: number;
}
export interface SeaEdge {
  from: SeaNode;
  to: SeaNode;
}

export function buildSeaGrid(minLat: number, maxLat: number, minLng: number, maxLng: number, step: number = 1): SeaNode[] {
  const nodes: SeaNode[] = [];
  for (let lat = minLat; lat <= maxLat; lat += step) {
    for (let lng = minLng; lng <= maxLng; lng += step) {
      let isLand = false;
      for (const land of landPolygons.features) {
        if (booleanPointInPolygon(point([lng, lat]), land)) {
          isLand = true;
          break;
        }
      }
      if (!isLand) {
        nodes.push({ lat, lng });
      }
    }
  }
  return nodes;
}

export function buildSeaEdges(nodes: SeaNode[], step: number = 1): SeaEdge[] {
  const edges: SeaEdge[] = [];
  for (const nodeA of nodes) {
    for (const nodeB of nodes) {
      if (nodeA === nodeB) continue;
      if (Math.abs(nodeA.lat - nodeB.lat) <= step && Math.abs(nodeA.lng - nodeB.lng) <= step) {
        const line = lineString([[nodeA.lng, nodeA.lat], [nodeB.lng, nodeB.lat]]);
        let crossesLand = false;
        for (const land of landPolygons.features) {
          // Use booleanIntersects to block any edge that touches or crosses land
          if (booleanIntersects(line, land)) {
            crossesLand = true;
            break;
          }
        }
        if (!crossesLand) {
          edges.push({ from: nodeA, to: nodeB });
        }
      }
    }
  }
  return edges;
}

export function buildGraph(nodes: SeaNode[], edges: SeaEdge[]) {
  const nodeIndex = new Map<string, number>();
  nodes.forEach((n, i) => nodeIndex.set(`${n.lat},${n.lng}`, i));
  const graph: Array<{ to: number; cost: number }[]> = Array(nodes.length).fill(null).map(() => []);
  edges.forEach(e => {
    const fromIdx = nodeIndex.get(`${e.from.lat},${e.from.lng}`);
    const toIdx = nodeIndex.get(`${e.to.lat},${e.to.lng}`);
    if (fromIdx !== undefined && toIdx !== undefined) {
      graph[fromIdx].push({ to: toIdx, cost: 1 });
    }
  });
  return { graph, nodeIndex, nodes };
}

function findNearestNode(nodes: SeaNode[], lat: number, lng: number): SeaNode {
  let minDist = Infinity;
  let nearest: SeaNode | null = null;
  for (const n of nodes) {
    const dist = Math.hypot(n.lat - lat, n.lng - lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = n;
    }
  }
  return nearest!;
}

export function findSeaRoute(
  start: SeaNode,
  end: SeaNode,
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  step: number = 1
): SeaNode[] {
  const nodes = buildSeaGrid(minLat, maxLat, minLng, maxLng, step);
  const edges = buildSeaEdges(nodes, step);
  const { graph, nodeIndex, nodes: nodeArr } = buildGraph(nodes, edges);
  const startNode = findNearestNode(nodeArr, start.lat, start.lng);
  const endNode = findNearestNode(nodeArr, end.lat, end.lng);
  const startIdx = nodeIndex.get(`${startNode.lat},${startNode.lng}`);
  const endIdx = nodeIndex.get(`${endNode.lat},${endNode.lng}`);
  if (startIdx === undefined || endIdx === undefined) return [];
  const path = jsAstar.astar.search(graph, startIdx, endIdx);
  return path.map((idx: number) => nodeArr[idx]);
}
