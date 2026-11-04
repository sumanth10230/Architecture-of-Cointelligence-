import { methodologyNodes, methodologyHub, methodologyDomains, methodologyRoutes } from '../data/methodology';
export type Point = { x: number; y: number };
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export type DiagramBounds = { left:number; right:number; top:number; bottom:number };
export function createDiagramLayout() {
  const originals = new Map<string, Point>(methodologyNodes.map(n => [n.id, { x: n.x, y: n.y }]));
  methodologyDomains.forEach(d => originals.set('domain:' + d.id, { x: d.x, y: d.y }));
  const placed = new Map<string, Point>();
  function move(id: string, point: Point, bounds: DiagramBounds = {left:76,right:824,top:76,bottom:824}) {
    // A domain and its taxonomy are one draggable object. Large circles may extend beyond the viewport.
    if (id.startsWith('domain:')) id=id.slice(7)+'-taxonomy';
    if (!originals.has(id)) return;
    placed.set(id, { x: clamp(point.x, bounds.left, bounds.right), y: clamp(point.y, bounds.top, bounds.bottom) });
  }
  function sample(seconds: number, still = false) {
    const points = new Map<string, Point>();
    let i = 0;
    for (const [id, origin] of originals) {
      const fixed = placed.get(id);
      // Independent slow phases give a gentle orbital drift, never spinning labels.
      const phase = i++ * 2.39996;
      const angle = still ? 0 : Math.sin(seconds*.16 + phase) * .02;
      const dx = origin.x-490, dy = origin.y-470;
      points.set(id, fixed || {
        x: 490 + dx*Math.cos(angle)-dy*Math.sin(angle) + (still ? 0 : Math.sin(seconds*.28+phase)*10),
        y: 470 + dx*Math.sin(angle)+dy*Math.cos(angle) + (still ? 0 : Math.cos(seconds*.23+phase)*10),
      });
    }
    methodologyDomains.forEach(d => points.set('domain:'+d.id, points.get(d.id+'-taxonomy')!));
    points.set(methodologyHub.id, { x: methodologyHub.x, y: methodologyHub.y });
    return { points, routes: methodologyRoutes(points) };
  }
  return { move, sample, reset() { placed.clear(); } };
}
