export const CARD_COUNT = 80;
export const CARDS_PER_LAYER = 40;
export const CARD_HEIGHT = .76;
export const CARD_WIDTH = CARD_HEIGHT * 7 / 6;
export const CAMERA_Z = 24;
export const backgroundCount = (compact = false) => compact ? 80 : 160;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const virtualTime = (sectionProgress: number) => clamp((sectionProgress - .10) / .84) * 3;
// Preserve the complete choreography in a three-second virtual timeline.
export const cardPhase = (seconds: number) => clamp(seconds / 3) * 6;
const travelAt = (t: number) => 5 * smooth(1, 2, t) + 18 * smooth(2, 3, t)
  + 7 * smooth(3, 4, t) + 14 * smooth(4, 5, t) + 16 * smooth(5, 5.75, t);

export function gridLayout(aspect = 16 / 9) {
  // Choose a complete factorisation of 40 closest to the viewport's proportions.
  const columns = [4, 5, 8, 10].reduce((best, candidate) =>
    Math.abs(Math.log((candidate / (40 / candidate) * 7 / 6) / aspect)) <
    Math.abs(Math.log((best / (40 / best) * 7 / 6) / aspect)) ? candidate : best, 8);
  const rows = CARDS_PER_LAYER / columns;
  const viewHeight = Math.max(rows * CARD_HEIGHT / .88, columns * CARD_WIDTH / (aspect * .94));
  return { columns, rows, viewHeight, stepX: viewHeight * aspect / columns, stepY: viewHeight / rows };
}
export type GridLayout = ReturnType<typeof gridLayout>;

export function cardDefinition(index: number, layout = gridLayout()) {
  if (index < 0 || index >= CARD_COUNT || !Number.isInteger(index)) throw new RangeError('Invalid card index');
  const slot = index % CARDS_PER_LAYER;
  const layer = Math.floor(index / CARDS_PER_LAYER);
  return {
    index, layer,
    x: ((slot % layout.columns) - (layout.columns - 1) / 2) * layout.stepX,
    y: ((layout.rows - 1) / 2 - Math.floor(slot / layout.columns)) * layout.stepY,
    baseZ: layer === 0 ? 0 : -36,
    depthOffset: (layer === 0 ? 1.8 : 2) + (layer === 0 ? 7.2 : 16) * ((slot * 17 + 11 + layer * 7) % 40) / 39,
  };
}

// Absolute sampling, not incremental simulation: any scroll history yields
// exactly the same frame. Only Z changes; camera and plane geometry stay fixed.
export function sampleCard(index: number, time: number, layout = gridLayout()) {
  const card = cardDefinition(index, layout);
  const t = Math.max(0, Math.min(6, time));
  const travel = travelAt(t);
  // The rear group is already a deep field before it is first revealed.
  const spread = card.layer === 0 ? smooth(1, 2, t) : 1;
  const z = card.baseZ + travel + card.depthOffset * spread;
  const reveal = card.layer === 0 ? 1 : smooth(1.2, 2, t);
  const opacity = reveal * smooth(.2, 1.3, CAMERA_Z - z);
  return { x: card.x, y: card.y, z, opacity };
}

// Repeat the foreground's two interconnected groups of forty at smaller apparent
// scales. Seeded jitter prevents distant rows from reading as parallel files.
export function sampleBackground(index: number, time: number, layout = gridLayout(), _compact = false) {
  const replica = Math.floor(index / 80);
  const card = cardDefinition(index % 80, layout);
  const fract = (x: number) => x - Math.floor(x);
  const baseZ = -130 - replica * 65 - card.layer * 28 + card.depthOffset;
  const depthScale = (CAMERA_Z + 130 + replica * 65) / CAMERA_Z;
  const x = (card.x + (fract((index+1)*.754877666)-.5)*layout.stepX*.65) * depthScale;
  const y = (card.y + (fract((index+1)*.569840296)-.5)*layout.stepY*.65) * depthScale;
  const z = baseZ + travelAt(Math.max(0, Math.min(6, time)));
  const opacity = smooth(1.15, 2.15, time) * (1 - smooth(5.65, 6, time)) * (.74-replica*.12);
  return { x, y, z, opacity, scale: 1.7 + fract(index*.3247)*.7, image: index % 88 };
}

export function backgroundPairs(count: number, layout = gridLayout(), _compact = false): [number, number][] {
  const pairs: [number, number][] = [];
  for (let replica=0; replica<count/80; replica++) {
    const offset = CARD_COUNT + replica*80;
    for (const [a,b] of connectionPairs(layout)) pairs.push([offset+a,offset+b]);
    // A few bridges join the replicated networks into one volume.
    if ((replica+1)*80<count) for (const slot of [5,15,25,35]) pairs.push([offset+40+slot, offset+80+slot]);
  }
  return pairs;
}

export function connectionPairs(layout = gridLayout()): [number, number][] {
  const pairs: [number, number][] = [];
  for (let layer = 0; layer < 2; layer++) {
    for (let slot = 0; slot < 40; slot++) {
      const i = layer * 40 + slot;
      const column = slot % layout.columns;
      const row = Math.floor(slot / layout.columns);
      if (column < layout.columns - 1) pairs.push([i, i + 1]);
      if (row < layout.rows - 1) pairs.push([i, i + layout.columns]);
      if (slot % 3 === 0 && column < layout.columns - 1 && row < layout.rows - 1) pairs.push([i, i + layout.columns + 1]);
      if (layer === 0) pairs.push([i, 40 + (slot + 7) % 40]);
    }
  }
  return pairs;
}
export const networkOpacity = (time: number) => smooth(1.05, 1.8, time);
export const pulseProgress = (edge: number, time: number) => {
  const phase = time * .7 + edge * .38196601125;
  return phase - Math.floor(phase);
};
