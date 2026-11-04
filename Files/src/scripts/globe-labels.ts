export function spherePoint(lon: number, lat: number) {
  const phi = (lon + 180) * Math.PI / 180;
  const theta = (90 - lat) * Math.PI / 180;
  return [-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)] as const;
}
export type LabelBox = { x: number; y: number; width: number; height: number };
export function placeLabel(x: number, y: number, width: number, height: number, labelWidth: number, labelHeight: number, occupied: LabelBox[]): LabelBox | null {
  if (width < labelWidth + 12 || height < labelHeight + 12) return null;
  const side = x > width / 2 ? 1 : -1;
  for (const direction of [side, -side]) {
    for (const offset of [-labelHeight / 2, -labelHeight - 18, 18, -labelHeight * 2, labelHeight + 18]) {
      const box = {
        x: Math.max(6, Math.min(width - labelWidth - 6, x + (direction > 0 ? 16 : -labelWidth - 16))),
        y: Math.max(6, Math.min(height - labelHeight - 6, y + offset)),
        width: labelWidth, height: labelHeight,
      };
      if (!occupied.some(other => box.x < other.x + other.width + 7 && box.x + box.width + 7 > other.x && box.y < other.y + other.height + 7 && box.y + box.height + 7 > other.y)) return box;
    }
  }
  return null;
}
