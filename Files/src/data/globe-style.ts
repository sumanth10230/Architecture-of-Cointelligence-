// Monochrome globe art direction. Marker styling does not encode risk severity.
export const globeStyle = {
  ocean: '#343434', land: '#b5b5b5', atmosphere: '#707070',
  marker: '#e32636', markerHighlight: '#ff4545',
  markerPixels: 2.8,
  // Screen-aligned lower-left shadow; the rest of the silhouette stays clear.
  shadowDirection: [-.65, -.76],
  shadowStart: .02, shadowEnd: .87, shadowStrength: .985,
};
