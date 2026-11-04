// Diagram geometry uses a 900 × 900 coordinate space. Edit copy and connections here.
export const prototypeImage = '/images/methodology/prototype.webp';
export interface MethodologyNode {
  id: string; x: number; y: number; label: string[]; description: string;
  domain?: 'species' | 'masterplan' | 'architecture';
  href?: string; image?: string; imageAlt?: string;
}
export const systemDescription = 'Species, master planning and architectural taxonomies combine in a machine-learned system. Its responses feed back into the next design iteration.';
export const methodologyNodes: MethodologyNode[] = [
  { id: 'climate', x: 90, y: 90, label: ['Climatic', 'data'], description: 'Climate observations describe the environmental conditions that influence species survival and habitat suitability.' },
  { id: 'land', x: 340, y: 55, label: ['Land use', 'data'], description: 'Land use records describe habitat change and human pressures on ecological systems.' },
  { id: 'species', x: 80, y: 430, label: ['Plant species', 'data'], description: 'Species records supply biological traits, distributions and environmental requirements.' },
  { id: 'prediction', x: 120, y: 230, label: ['Loss prediction', 'model'], description: 'A predictive model combines ecological inputs to estimate where species loss may occur. Predictions are model outputs, not confirmed extinctions.' },
  { id: 'species-taxonomy', x: 330, y: 330, label: ['Species', 'taxonomy'], domain: 'species', href: '#chapter-04', image: '/images/methodology/species.webp', imageAlt: 'Plant species photocards with environmental metadata', description: 'At-risk species are clustered by their traits and environmental needs, producing metadata for spatial organisation. Open the Species Taxonomy chapter.' },
  { id: 'context', x: 820, y: 95, label: ['Site context', 'data'], description: 'Site conditions and context colour fields provide the spatial inputs for a specific location.' },
  { id: 'masterplan-taxonomy', x: 660, y: 330, label: ['Master planning', 'taxonomy'], domain: 'masterplan', href: '#chapter-05', image: '/images/methodology/masterplan.webp', imageAlt: 'Weighted adjacency network for seed-bank programme relationships', description: 'Site context and species metadata are organised into spatial relationships and master plan configurations. Open the Master Planning Taxonomy chapter.' },
  { id: 'synthetic', x: 820, y: 440, label: ['Synthetic', 'database'], description: 'Parametric samples respond to species and master planning metadata, linking environmental conditions to possible architectural behaviours.' },
  { id: 'instructions', x: 720, y: 825, label: ['Architectural', 'instructions'], description: 'Vector rules translate metadata into actions: pylon movement, force direction and system response.' },
  { id: 'architecture-taxonomy', x: 490, y: 670, label: ['Architectural', 'taxonomy'], domain: 'architecture', href: '#chapter-08', image: '/images/methodology/architecture.webp', imageAlt: 'Adaptive architectural surface with force directions and anchor points', description: 'Material behaviour and architectural instructions form a taxonomy of adaptive configurations. Open the Architectural Taxonomy chapter.' },
  { id: 'materials', x: 170, y: 805, label: ['Material', 'database'], description: 'Material properties and physical constraints guide which architectural configurations can be realised.' },
];
export const methodologyHub = { id: 'intelligence', x: 490, y: 470 };
export const methodologyDomains = [
  { id: 'species', x: 330, y: 330, radius: 220 },
  { id: 'masterplan', x: 660, y: 330, radius: 230 },
  { id: 'architecture', x: 490, y: 670, radius: 220 },
];
export const methodologyEdges = [
  ['climate', 'prediction'], ['land', 'prediction'], ['species', 'prediction'],
  ['prediction', 'species-taxonomy'], ['species-taxonomy', 'masterplan-taxonomy'],
  ['context', 'masterplan-taxonomy'], ['species-taxonomy', 'synthetic'],
  ['masterplan-taxonomy', 'synthetic'], ['synthetic', 'instructions'],
  ['instructions', 'architecture-taxonomy'], ['materials', 'architecture-taxonomy'],
  ['species-taxonomy', 'intelligence'], ['masterplan-taxonomy', 'intelligence'],
  ['architecture-taxonomy', 'intelligence'], ['intelligence', 'synthetic'],
] as const;

// Straight connections terminate at node boundaries. Node placement keeps the hub clear.
export function methodologyRoutes(positions: Map<string, { x: number; y: number }> = new Map([...methodologyNodes, methodologyHub].map(node => [node.id, node]))) {
  const radius = (id: string) => id === 'intelligence' ? 88 : methodologyNodes.find(node => node.id === id)?.domain ? 65 : 13;
  return methodologyEdges.map(([from, to]) => {
    const a = positions.get(from)!, b = positions.get(to)!;
    const point = (origin: { x: number; y: number }, toward: { x: number; y: number }, offset: number) => {
      const length = Math.hypot(toward.x-origin.x, toward.y-origin.y);
      return { x: origin.x+(toward.x-origin.x)*offset/length, y: origin.y+(toward.y-origin.y)*offset/length };
    };
    const distance = Math.hypot(b.x-a.x, b.y-a.y);
    // Overlapping dragged nodes have no exposed connector; avoid inverted arrows or NaN.
    if (distance <= radius(from)+radius(to)+12) return { from, to, start: a, end: b, d: '' };
    const start = point(a, b, radius(from)+3);
    const end = point(b, a, radius(to)+9);
    const d = `M${start.x},${start.y} L${end.x},${end.y}`;
    return { from, to, start, end, d };
  });
}
