import digitalStudies from './digital-studies.json';
// EDIT HERE: all copy, links, project details, and media paths.
// Illustrative project/research entries are placeholders, not claims of completed work.
export const site = {
  name: 'ACI',
  title: 'Architecture of Co-Intelligence',
  description: 'An exploration of architecture, material behaviour, and collective intelligence.',
  email: 'contact.aci.uk@gmail.com',
  instagram: 'https://www.instagram.com/',
  publications: '#research',
  hero: { video: '/media/hero.mp4', mobileVideo: '/media/hero-mobile.mp4', poster: '/media/hero-poster.jpg', secondStatement: 'Where Living Intelligence\nShapes Space.' },
  introduction: 'Exploring the space between architecture, living systems, and emerging intelligence.',
  about: 'ACI — Architecture of Co-Intelligence is an architectural thesis research project developed at AADRL, Spyropoulos Studio. The study explores how ecological data, machine learning and responsive physical systems can inform an adaptive architecture.',
  interests: ['Adaptive environments', 'Computational design', 'Material intelligence', 'Collective systems'],
};

export const prototypeSlides = [
  { src:'/images/prototype/prototype-1.webp',alt:'Working prototype: tensile surface and motor-driven supports' },
  { src:'/images/prototype/prototype-2.webp',alt:'View beneath the tensile surface showing actuators and connections' },
  { src:'/images/prototype/prototype-3.webp',alt:'Close study of the prototype membrane and pylon peaks' },
];
export const modelSlides = Array.from({length:7},(_,i)=>({src:`/images/study-models/model-${i+1}.webp`,alt:`Physical study model ${i+1} developed during the research`}));
const modelDescriptions = [
  {name:'Atmos 1.0',description:'Atmos 1.0 marks a transition from conceptual experimentation to data-driven microclimatic regulation. Using condensation as a testing medium, the prototype translates ecological data into controlled environmental responses. Beyond water production, it demonstrates how architecture can materialise abstract datasets into measurable climatic behaviour.'},
  {name:'Atmos 2.0',description:'Building on Atmos 1.0, Atmos 2.0 translates live wind data into adaptive microclimatic regulation. Inspired by natural canopy protection, Python processes wind vectors to control nine servo-driven barriers, dynamically adjusting their orientation against incoming winds. The prototype demonstrates how architecture can mimic ecological strategies to create protective microclimates.'},
  {name:'ACI working prototype 0.1',description:'A physical prototype translates seed taxonomy data into responsive spatial behaviour. Unsupervised clustering identifies relationships between species, converting computational outputs into control parameters. Through microcontrollers and motorised actuators, these datasets drive structural movement, dynamically adjusting position, tension, and height to demonstrate the physical manifestation of ecological intelligence.'},
  {name:'Double-layer tensile system',description:'The double-layer tensile system generates adaptable spatial conditions through controlled membrane tension and movement. By adjusting interactions between layers, spaces transition between open, semi-enclosed, and enclosed configurations. Driven by species-specific requirements, these transformations regulate gradients of exposure, protection, and connectivity between interior and exterior environments.'},
  {name:'Within the surface',description:'Extending tensile logic beyond enclosure, the system explores adaptive spatial subdivisions through multiple pull and anchor points. Controlled tension generates diverse internal configurations, accommodating distinct ecological and functional requirements. The physical prototype demonstrates how flexible tensile networks can dynamically reorganise interior spaces without relying on fixed partitions.'},
  {name:'Multi layer tensile behaviour',description:'Understanding the interplay of forces within tensile membranes establishes the structural foundation for spatial formation. By translating tension and geometry into architecture, the system generates a family of distinct volumetric conditions. Each configuration responds to specific forces while accommodating diverse ecological and programmatic requirements.'},
  {name:'Material study',description:'Material strategies enable species-specific microclimatic regulation through variations in permeability, thermal properties, and environmental responsiveness. By modulating temperature, humidity, and airflow, these material configurations create differentiated climatic conditions, allowing diverse ecological requirements to be accommodated within a unified, adaptive architectural system.'},
];
// Sequence follows the supplied attachment order: EXT4, EXT2, EXT3, INT 3, EXT1, EXT5, INT1.
export const renderSlides = [
  {src:'/images/renders/render-4.webp',srcset:'/images/renders/render-4-small.webp 1280w, /images/renders/render-4.webp 2400w',alt:"Exterior tensile towers rising above the forest"},
  {src:'/images/renders/render-2.webp',srcset:'/images/renders/render-2-small.webp 1280w, /images/renders/render-2.webp 2400w',alt:"Closer aerial view of the illuminated canopy and surrounding forest"},
  {src:'/images/renders/render-3.webp',srcset:'/images/renders/render-3-small.webp 1280w, /images/renders/render-3.webp 2400w',alt:"View of the biome from inside a helicopter cockpit"},
  {src:'/images/renders/render-7.webp',srcset:'/images/renders/render-7-small.webp 1280w, /images/renders/render-7.webp 2400w',alt:"Interior garden path beneath the continuous tensile surface"},
  {src:'/images/renders/render-1.webp',srcset:'/images/renders/render-1-small.webp 1280w, /images/renders/render-1.webp 2400w',alt:"Aerial view of the Intelligent Biome canopy within a mist-covered forest"},
  {src:'/images/renders/render-5.webp',srcset:'/images/renders/render-5-small.webp 1280w, /images/renders/render-5.webp 2400w',alt:"Forest approach towards the biome canopy"},
  {src:'/images/renders/render-6.webp',srcset:'/images/renders/render-6-small.webp 1280w, /images/renders/render-6.webp 2400w',alt:"Planted interior beneath the canopy and a structural pylon"},
];

// Photographs retain ZIP entry order; replace or reorder these entries to curate the trail.
export const researchMoments = [
  {src:'/images/research/moment-01.webp',alt:"Research presentation beside physical models and a projected slide",width:1280,height:720},
  {src:'/images/research/moment-02.webp',alt:"Prototype on display in an exhibition space",width:675,height:900},
  {src:'/images/research/moment-03.webp',alt:"Black-and-white photograph of a model review and presentation",width:1200,height:900},
  {src:'/images/research/moment-04.webp',alt:"Working prototype and equipment in the studio",width:675,height:900},
  {src:'/images/research/moment-05.webp',alt:"Discussion beside an illuminated architectural model",width:1400,height:786},
  {src:'/images/research/moment-06.webp',alt:"Research presentation to a seated audience",width:1200,height:900},
  {src:'/images/research/moment-07.webp',alt:"Group photograph beside the prototype display",width:1200,height:900},
  {src:'/images/research/moment-08.webp',alt:"Visitor examining the tensile prototype at an exhibition",width:675,height:900},
  {src:'/images/research/moment-09.webp',alt:"Printed project material beside the model display",width:675,height:900},
  {src:'/images/research/moment-10.webp',alt:"Prototype displayed at London Creates",width:1200,height:900},
];
export interface StudyDrawing { src:string; title:string; description:string; legend:string[]; companion?: {src:string;title:string}; }
export interface Study { video?:{href:string;label:string}; id:string; title:string; expandedTitle?:string; making?:{src:string;alt:string}[]; category:string; year:string; image:string; alt:string; description:string; detail:string; slides?:typeof prototypeSlides; drawings?:StudyDrawing[]; pending?:string[]; models?: {title:string;src:string;images?:string[];description:string}[]; }
export const projects: Study[] = [
  { id:'working-prototype',title:'ACI working prototype',expandedTitle:'ACI — Working Prototype',category:'Adaptive architectural system',year:'2026',image:prototypeSlides[0].src,alt:prototypeSlides[0].alt,slides:prototypeSlides,
    description:'The ACI prototype demonstrates a fully operational, data-responsive architectural system. Using weather data as a proxy, it responds as subdivisions are added or densified within the secondary membrane: structural feedback triggers pylon adjustments to restore equilibrium. Coordinated servo motors and linear actuators regulate membrane tension, height, and spatial articulation, allowing the double-layer tensile system to continuously reconfigure its geometry and internal spaces. It establishes a physical proof of concept for adaptive architectural intelligence.',
    detail:'',
    video:{href:'https://youtu.be/kgrqU93KOG4?si=9ekskBC_FCeQvVm1',label:'Watch the working prototype'},
    drawings:[
      {src:'/images/prototype/assembly.png',title:'01 — Prototype assembly',description:'Seven coordinated pylon units form the adaptive structure, responding to four trigger motors that generate secondary membrane subdivisions. As these subdivisions change, pylons adjust their positions and angles. The 25-motor system is controlled by an Arduino Mega and external servo drivers, enabling synchronised multi-actuator operation.',legend:[]},
      {src:'/images/prototype/pylon-unit.png',title:'02 — Pylon unit',description:'Each modular pylon integrates two servos controlling yaw and pitch, with a linear actuator enabling vertical adjustment. Together, these components provide multi-degree-of-freedom movement, combining 360-degree directional coverage with height control, allowing the pylons to dynamically adjust their orientation and position within the adaptive tensile system.',legend:['1. Linear actuator','2. Pitch servo','3. Yaw servo'],companion:{src:'/images/prototype/tension-drive.png',title:'Trigger mechanism'}},
    ],
    making:[
      {src:'/images/prototype/making-1.webp',alt:'Hand stitching the cellular pattern into the tensile membrane'},
      {src:'/images/prototype/making-2.webp',alt:'Stitching the membrane layers by hand during fabrication'},
      {src:'/images/prototype/making-3.webp',alt:'Assembling the prototype actuators and wiring beneath the membrane supports'},
    ] },
  {id:'study-models',title:'Study models',category:'',year:'',image:modelSlides[0].src,alt:modelSlides[0].alt,slides:modelSlides,
   description:'Throughout the research, we used physical models to test and refine the system’s structure, vary its surface configurations and study how each change shaped the spaces beneath the membrane.',detail:'',
   models:modelSlides.map((slide,i)=>({title:`Study model ${String(i+1).padStart(2,'0')} — ${modelDescriptions[i].name}`,src:slide.src,description:modelDescriptions[i].description}))},
  {id:'digital-studies',title:'Digital & parametric studies',category:'Computational studies',year:'2026',image:'/images/study-models/digital-study.webp',alt:'Parametric architectural surface with pylon and subdivision vector metadata',expandedTitle:'Digital prototypes',description:'These digital simulations and parametric studies trace how we developed the architectural system throughout our research.',detail:'',models:digitalStudies},

];

export const publications = [
  { number: '01', title: 'Architecture of Co-Intelligence research book', description: 'Explore the research book and project methodology.', type: 'Research book', source: 'Calaméo', href: 'https://www.calameo.com/books/008146084e7f09dcd4b78' },
  { number: '02', title: 'Architecture of Co-Intelligence: Theodore Spyropoulos’s Vision for Planetary Design', description: 'Read the project feature in Parametric Architecture.', type: 'Publication feature', source: 'Parametric Architecture', href: 'https://parametric-architecture.com/architecture-of-co-intelligence/' },
  { number: '03', title: 'Wooden Play Apparatus — Architectural Association', description: 'View the Architectural Association School Shows feature on Dezeen.', type: 'School Shows', source: 'Dezeen', href: 'https://www.dezeen.com/schoolshows/wooden-play-apparatus-architectural-association-schoolshows/' },
];

// Replace null contact values with each person's personal URLs and email address.
export interface TeamMember { name:string; position:string; linkedin:string|null; instagram:string|null; email:string|null; }
export const teamPhoto = {src:'/images/team/core-team.webp',alt:'Core research team: Supreeth Vijayakumar, Sumanth Gangadhar Sogal and Kian Jansuwan, from left to right',width:1600,height:1068};
export const team: TeamMember[] = [
  {name:'Supreeth Vijayakumar',position:'Pictured left',linkedin:'https://www.linkedin.com/in/supreeth-vijayakumar-0442061a4/',instagram:'https://www.instagram.com/supreeth.vijay/',email:'contact.supreethv@gmail.com'},
  {name:'Sumanth Gangadhar Sogal',position:'Pictured centre',linkedin:'https://www.linkedin.com/in/sumsg/',instagram:'https://www.instagram.com/sumanth__sogal/',email:'sumanthgsogal2000@gmail.com'},
  {name:'Kian Jansuwan',position:'Pictured right',linkedin:'https://www.linkedin.com/in/kian-jan/',instagram:'https://www.instagram.com/kian.jan/',email:'Kian.jansuwan@gmail.com'},
];
export const acknowledgements = { name:'Dr. Theodore Spyropoulos', role:'Studio master · Spyropoulos Studio', image:'/images/team/theodore-spyropoulos.webp', description:'Dr. Theodore Spyropoulos is an architect and educator, director of the Architectural Association Design Research Laboratory, and founder of Minimaforms.', courseTutors:['Apostolos Despotidis','Elisavet Konstantinidou','Hanjun Kim','Octavian Mihai Gheorghiu'], courseMasters:['Nassia Inglessis','David Greene'] };
