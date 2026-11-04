import type { GlobeLayer } from '../data/globe-layers';
export type LayerWeights = [number, number, number];
export function toggledLayer(current: GlobeLayer, clicked: Exclude<GlobeLayer,'species'>): GlobeLayer {
  return current === clicked ? 'species' : clicked;
}
export function blendLayers(weights: LayerWeights, target: GlobeLayer, seconds: number, immediate=false): LayerWeights {
  const index = {species:0,land:1,climate:2}[target];
  const amount = immediate ? 1 : 1-Math.exp(-Math.max(0,seconds)*6);
  const next = weights.map((weight,i)=>weight+((i===index?1:0)-weight)*amount) as LayerWeights;
  if (next[index] > .999) return [0,1,2].map(i=>i===index?1:0) as LayerWeights;
  return next;
}
export function layersSettled(weights: LayerWeights, target: GlobeLayer) {
  return weights[{species:0,land:1,climate:2}[target]] === 1;
}
