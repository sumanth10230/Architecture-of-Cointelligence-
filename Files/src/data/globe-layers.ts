export type GlobeLayer = 'species' | 'land' | 'climate';
export const climatePins = [
  {id:'san-francisco',name:'San Francisco',lon:-122.42,lat:37.77,value:'+1.3°C',label:'Temperature change'},
  {id:'buenos-aires',name:'Buenos Aires',lon:-58.38,lat:-34.6,value:'+0.9°C',label:'Temperature change'},
  {id:'czechia',name:'Czech Republic',lon:15.47,lat:49.82,value:'+2.2°C',label:'Temperature change'},
  {id:'franz-josef',name:'Franz Josef Land',lon:55,lat:80.6,value:'+4.9°C',label:'Highest warming in the map'},
  {id:'tokyo',name:'Tokyo',lon:139.69,lat:35.68,value:'+1.2°C',label:'Temperature change'},
  {id:'madagascar',name:'Madagascar',lon:46.87,lat:-18.77,value:'+1.1°C',label:'Temperature change'},
  {id:'sydney',name:'Sydney',lon:151.21,lat:-33.87,value:'+1.4°C',label:'Temperature change'},
  {id:'weddell',name:'Weddell Sea',lon:-30,lat:-73,value:'−1.4°C',label:'Highest cooling in the map'},
].map(pin=>({...pin,date:'1961–2019 · map examples',layer:'climate' as const}));
export const landPins = [
  {id:'land-europe',name:'Europe',lon:15,lat:50,value:'Forest gain',label:'Cropland abandonment'},
  {id:'land-us',name:'United States',lon:-100,lat:38,value:'Repeated use',label:'Agricultural intensification'},
  {id:'land-brazil',name:'Brazil / Amazon',lon:-60,lat:-10,value:'Forest loss',label:'Agriculture and pasture'},
  {id:'land-africa',name:'Nigeria / Cameroon',lon:10,lat:7,value:'Forest loss',label:'Cocoa-related conversion'},
  {id:'land-china',name:'China',lon:105,lat:35,value:'Forest gain',label:'Pasture also expanded'},
  {id:'land-australia',name:'Australia',lon:134,lat:-25,value:'Repeated use',label:'Cropland–pasture transitions'},
].map(pin=>({...pin,date:'1960–2019 · study examples',layer:'land' as const}));
export const temperatureColours=['#080711','#211137','#3a1956','#554660','#69266e','#932e87','#c13e88','#ed647d','#ff936d'];
export const temperatureEdges=['−2','−1','−0.5','−0.2','0.2','0.5','1','2','4','4.9'];
