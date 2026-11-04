export interface ThesisChapter {

  id: string;

  number: string;

  title: string;

  subtitle?: string;

  body: string;

  label: string;

  video: string;

  mobileVideo: string;

  poster: string;

  duration: number;

  kind?: 'film' | 'globe' | 'cards' | 'study' | 'loop' | 'methodology' | 'finale';

  scrollVh?: number;

  detailImage?: string;

  mobilePoster?: string;

  overlay?: 'biomes' | 'species' | 'masterplan';

}



// Ten editable chapters after the opening film. IDs remain stable when chapters move.

// Most chapters use 225svh; cards/surface use 350, the three-stage system 430, and finale 150.

// Example: video: '/media/chapters/01.mp4'. Leave empty to keep the

// animated visual placeholder; no missing video is requested.

// mobileVideo is optional and falls back to the desktop video.

// duration is narrative time; looping films retain their full natural playback length.

export const chapters: ThesisChapter[] = [

  { id: 'chapter-01', number: '01', kind: 'film', scrollVh: 225, label: "Everything intelligence.", title: "Everything\nintelligence.", body: "Amid planetary crisis, architecture is positioned as an active mediator between multiple forms of intelligence. Beyond artificial computation, intelligence is understood as the capacity to adapt, learn, and sustain life. Challenging the human-centric limitations of AI, the research foregrounds ecological intelligence, embodied in the seed, a vessel of genetic knowledge and adaptation preserved across millennia.", video: '/media/chapters/02-desktop.mp4', mobileVideo: '/media/chapters/02-mobile.mp4', poster: '/media/chapters/02-poster.jpg', duration: 3 },

  { id: 'chapter-02', number: '02', kind: 'globe', scrollVh: 225, label: "Planetary Crisis", title: "Planetary\nCrisis", body: "Climate change, deforestation, and temperature anomalies are increasingly mapped and measured. Yet the genetic intelligence embedded within seeds remains largely invisible and disconnected from public consciousness. With an estimated 45% of flowering plant species threatened with extinction, this irreplaceable archive of biological adaptation faces the risk of irreversible loss.", video: '', mobileVideo: '', poster: '', duration: 3 },

  { id: 'chapter-03', number: '03', kind: 'cards', scrollVh: 350, label: "The Living Seed Bank", title: "The Living\nSeed Bank", body: "If artificial intelligence encodes information in digital bits, seeds encode the genetic instructions for life. The project reimagines the seed bank as a living, co-intelligent infrastructure, where architecture makes genetic intelligence visible and active. Integrating biological and ecological data, it transforms conventional preservation into an adaptive, transparent, and publicly accessible system.", video: '', mobileVideo: '', poster: '', duration: 3 },

  { id: 'chapter-methodology', number: '04', kind: 'methodology', scrollVh: 225, label: "Methodology", title: "Methodology", body: "Architecture emerges through interconnected taxonomies shaped by ecological data and computational modelling. Species taxonomy defines the biological needs of plants; parametric algorithms generate iterative spatial possibilities. Programmatic taxonomy organizes seed-bank functions, while architectural taxonomy integrates these layers into a unified, collectively intelligent spatial system.", video: '', mobileVideo: '', poster: '', duration: 3 },

  { id: 'chapter-04', number: '05', kind: 'loop', scrollVh: 350, overlay: 'species', label: "Species Taxonomy", title: "Species\nTaxonomy", subtitle: "Species\nTaxonomy", body: "Ecological data drives the seed bank’s AI-driven architectural organisation. t-SNE maps high-dimensional species attributes into legible relationships, while DBSCAN identifies habitat-compatible clusters. These clusters inform spatial adjacencies, programmatic subdivisions, and structural scaling, enabling the architecture to adapt as species populations and environmental conditions evolve.", video: '/media/chapters/species-desktop.mp4', mobileVideo: '/media/chapters/species-mobile.mp4', poster: '/media/chapters/species-poster.jpg', duration: 3 },

  { id: 'chapter-05', number: '06', kind: 'loop', scrollVh: 350, overlay: 'masterplan', label: "Masterplan Taxonomy", title: "Masterplan\nTaxonomy", subtitle: "Masterplan\nTaxonomy", body: "To organise thousands of species, graph-based algorithms process ecological and programmatic relationships, while a self-organising map interprets contextual colour data. Bubble physics guides the masterplan through minimal-surface equilibrium and cellular packing, translating these relationships into efficient spans, interconnected spatial subdivisions, and optimised species distribution.", video: '/media/chapters/masterplan-desktop.mp4', mobileVideo: '/media/chapters/masterplan-mobile.mp4', poster: '/media/chapters/masterplan-poster.jpg', duration: 3 },

  { id: 'chapter-06', number: '07', kind: 'study', scrollVh: 430, detailImage: '/images/tensile/system-detail.webp', label: "Architectural System", title: "Architectural\nSystem", subtitle: "Architectural\nSystem", body: "Drawing on Frei Otto’s form-finding models, the research explores long-span tensile structures that adapt to evolving ecological needs. Iterative prototypes investigate push-and-pull points to create flexible cellular subdivisions. Ultimately, species and environmental data are envisioned to drive actuation, transforming static enclosures into responsive ecological habitats.", video: '', mobileVideo: '', poster: '/images/tensile/workshop.webp', duration: 3 },

  { id: 'chapter-07', number: '08', kind: 'loop', overlay: 'biomes', scrollVh: 350, label: "Within the Surface", title: "Within the\nSurface", body: "Conceived as a surface within a surface, the layered tensile system separates enclosure from adaptation. A primary membrane provides continuous coverage, while a secondary, adjustable membrane forms internal subdivisions. Through shifting push-and-pull points, this inner layer reshapes habitats in response to evolving species requirements and ecological data.", video: '/media/chapters/08-desktop.mp4', mobileVideo: '/media/chapters/08-mobile.mp4', poster: '/media/chapters/08-poster.jpg', duration: 3 },

  { id: 'chapter-08', number: '09', kind: 'loop', scrollVh: 225, label: "Architectural Taxonomy", title: "Architectural\nTaxonomy", subtitle: "Architectural\nTaxonomy", body: "Architectural taxonomy is developed through a tailored synthetic dataset generated by a custom parametric algorithm. A core Vectorial Ruleset and Material Property Library integrate volumetric geometry, climatic adaptation, and material performance into a unified dataset, enabling analysis of evolving typologies and performance-driven generative design.", video: '/media/chapters/architecture-desktop.mp4', mobileVideo: '/media/chapters/architecture-mobile.mp4', poster: '/media/chapters/architecture-poster.jpg', duration: 3 },

  { id: 'chapter-finale', number: '10', kind: 'finale', scrollVh: 150, label: 'Intelligent biome', title: 'Architecture of Co-Intelligence', body: 'Intelligent Biome', video: '', mobileVideo: '', poster: '/images/project/intelligent-biome.webp', mobilePoster: '/images/project/intelligent-biome-mobile.webp', duration: 3 },

];

