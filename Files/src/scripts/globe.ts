// Three.js is vendored locally with its MIT license; no external runtime requests.
import { globeStyle } from '../data/globe-style';
import coastPaths from '../data/continent-lines.json';
import evidence from '../data/conservation.json';
import { climatePins, landPins, type GlobeLayer } from '../data/globe-layers';
import { toggledLayer, blendLayers, layersSettled, type LayerWeights } from './globe-layer-state';
import { spherePoint, placeLabel, type LabelBox } from './globe-labels';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.querySelector<HTMLElement>('[data-globe]');

async function mountGlobe(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>('.globe-viewport')!;
  const button = root.querySelector<HTMLButtonElement>('.globe-toggle')!;
  const status = root.querySelector<HTMLElement>('.globe-status')!;
  let renderFrame = 0;
  let visible = false;
  let paused = reduced.matches;
  let failed = false;
  let dragging = false;
  let pointerX = 0;
  let pointerTime = 0;
  let angularVelocity = 0;
  let previousTime = 0;
  let renderer: any;
  let resizeObserver: ResizeObserver | undefined;
  let visibilityObserver: IntersectionObserver | undefined;
  let activeLayer: GlobeLayer = 'species';
  let layerBlend: LayerWeights = [1,0,0];
  let layerWake = () => {};
  const choices = [...root.querySelectorAll<HTMLInputElement>('[data-layer-choice]')];
  choices.forEach(choice => choice.addEventListener('change', () => {
    activeLayer = toggledLayer(activeLayer, choice.dataset.layerChoice as 'land'|'climate');
    root.dataset.layer = activeLayer;
    choices.forEach(input => { input.checked = input.dataset.layerChoice === activeLayer; });
    root.querySelectorAll<HTMLElement>('[data-layer-key]').forEach(key => { key.hidden = key.dataset.layerKey !== activeLayer; });
    status.textContent = activeLayer === 'species' ? 'Original species map selected.' : `${activeLayer === 'land' ? 'Human modification' : 'Temperature change'} map selected. Approximate image reconstruction.`;
    layerWake();
  }));

  const showFallback = () => {
    failed = true;
    cancelAnimationFrame(renderFrame);
    renderFrame = 0;
    root.dataset.state = 'fallback';
    button.hidden = true;
    status.textContent = 'The interactive globe is unavailable. The original data map is shown instead.';
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    renderer?.dispose();
    renderer?.domElement.remove();
  };

  try {
    // The vendored upstream JS has no TypeScript declarations.
    const T: any = await import('../../vendor/three/three.module.js');
    const response = await fetch('/data/planet-points.json');
    if (!response.ok) throw new Error('Map data unavailable');
    const data = await response.json() as { points: [number, number, number][] };
    const surface = await new T.TextureLoader().loadAsync('/textures/planet-land-mask.png');
    surface.colorSpace = T.NoColorSpace;
    const [humanTexture, climateTexture] = await Promise.all([
      new T.TextureLoader().loadAsync('/textures/human-modification.webp'),
      new T.TextureLoader().loadAsync('/textures/temperature-change.webp'),
    ]);
    humanTexture.colorSpace = climateTexture.colorSpace = T.SRGBColorSpace;
    const layerUniforms = {
      humanTexture:{value:humanTexture}, climateTexture:{value:climateTexture},
      layerWeights:{value:new T.Vector3(1,0,0)},
    };
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 800 ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', (event: Event) => {
      event.preventDefault();
      showFallback();
    }, { once: true });
    viewport.append(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(40, 1, .1, 30);
    camera.position.set(0, 0, 3.3);
    const planet = new T.Group();
    planet.rotation.set(.06, -Math.PI * .7, -.09);
    scene.add(planet);
    const geometry = new T.SphereGeometry(1, 96, 64);
    const shadowUniforms = {
      shadowDirection: { value: new T.Vector2(...globeStyle.shadowDirection).normalize() },
      shadowBounds: { value: new T.Vector2(globeStyle.shadowStart, globeStyle.shadowEnd) },
      shadowStrength: { value: globeStyle.shadowStrength },
    };
    const shadowGLSL = `uniform vec2 shadowDirection; uniform vec2 shadowBounds; uniform float shadowStrength;
      float directionalShade(vec2 surfaceXY) {
        return 1. - shadowStrength * smoothstep(shadowBounds.x, shadowBounds.y, dot(surfaceXY, shadowDirection));
      }\n`;
    const earthMaterial = new T.MeshPhongMaterial({ map: surface, shininess: 8, specular: 0x111111 });
    earthMaterial.onBeforeCompile = (shader: any) => {
      shader.uniforms.oceanColor = { value: new T.Color(globeStyle.ocean) };
      shader.uniforms.landColor = { value: new T.Color(globeStyle.land) };
      Object.assign(shader.uniforms, shadowUniforms);
      Object.assign(shader.uniforms, layerUniforms);
      shader.fragmentShader = shadowGLSL + 'uniform vec3 oceanColor; uniform vec3 landColor; uniform sampler2D humanTexture; uniform sampler2D climateTexture; uniform vec3 layerWeights;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = layerWeights.x * mix(oceanColor, landColor, diffuseColor.r) + layerWeights.y * texture2D(humanTexture,vMapUv).rgb + layerWeights.z * texture2D(climateTexture,vMapUv).rgb;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight *= directionalShade(-vViewPosition.xy);\n #include <opaque_fragment>');
    };
    const earth = new T.Mesh(geometry, earthMaterial);
    planet.add(earth);
    // One screen-space hairline, drawn only while the climate field is visible.
    const coastVertices: number[] = [];
    for (const path of coastPaths) {
      const vertices = path.map(([x,y]) => spherePoint(x / 2048 * 360 - 180, 90 - y / 1024 * 180));
      for (let i = 1; i < vertices.length; i++) coastVertices.push(...vertices[i-1], ...vertices[i]);
    }
    const coastGeometry = new T.BufferGeometry();
    coastGeometry.setAttribute('position', new T.Float32BufferAttribute(coastVertices, 3));
    const coastInk = new T.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
    const coast = new T.LineSegments(coastGeometry, coastInk);
    coast.scale.setScalar(1.00015);
    planet.add(coast);
    scene.add(new T.AmbientLight(0xffffff, .75));
    const key = new T.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 3, 4);
    scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, .35);
    rim.position.set(3, -1, -2);
    scene.add(rim);

    const positions = new Float32Array(data.points.length * 3);
    const weights = new Float32Array(data.points.length);
    data.points.forEach(([lon, lat, weight], index) => {
      // Exactly the same spherical UV convention as SphereGeometry / the texture.
      const phi = (lon + 180) * Math.PI / 180;
      const theta = (90 - lat) * Math.PI / 180;
      const radius = 1.004 + weight * .002;
      positions[index * 3] = -radius * Math.cos(phi) * Math.sin(theta);
      positions[index * 3 + 1] = radius * Math.cos(theta);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      weights[index] = weight;
    });
    const dotsGeometry = new T.BufferGeometry();
    dotsGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
    dotsGeometry.setAttribute('weight', new T.BufferAttribute(weights, 1));
    const dotsMaterial = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true,
      uniforms: { ...shadowUniforms, ...layerUniforms, pixelRatio: { value: renderer.getPixelRatio() }, pointSize: { value: globeStyle.markerPixels }, marker: { value: new T.Color(globeStyle.marker) }, highlight: { value: new T.Color(globeStyle.markerHighlight) } },
      vertexShader: `attribute float weight;
        uniform float pixelRatio;
        uniform float pointSize;
        varying float facing;
        varying vec2 surfaceXY;
        void main(){
          vec4 mv=modelViewMatrix*vec4(position,1.0);
          surfaceXY=mv.xy;
          facing=dot(normalize(normalMatrix*normalize(position)),normalize(-mv.xyz));
          gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp(pointSize*pixelRatio*2.7/-mv.z,2.*pixelRatio,4.*pixelRatio);
        }`,
      fragmentShader: shadowGLSL + `varying float facing; varying vec2 surfaceXY; uniform vec3 marker; uniform vec3 highlight; uniform vec3 layerWeights;
        void main(){
          float radius=length(gl_PointCoord-vec2(.5));
          if(radius>.5) discard;
          vec3 colour=mix(marker,highlight,(1.-smoothstep(0.,.35,radius))*.3);
          gl_FragColor=vec4(colour,layerWeights.x*(1.-smoothstep(.3,.5,radius))*.92*smoothstep(0.,.03,facing)*directionalShade(surfaceXY));
          #include <colorspace_fragment>
        }`,
    });
    planet.add(new T.Points(dotsGeometry, dotsMaterial));

    const atmosphere = new T.Mesh(new T.SphereGeometry(1.028, 64, 48), new T.ShaderMaterial({
      uniforms: { ...shadowUniforms, rimColor: { value: new T.Color(globeStyle.atmosphere) } },
      transparent: true, depthWrite: false, side: T.BackSide, blending: T.AdditiveBlending,
      vertexShader: `varying vec3 normalView; varying vec3 positionView;
        void main(){normalView=normalize(normalMatrix*normal);
          vec4 mv=modelViewMatrix*vec4(position,1.);positionView=mv.xyz;
          gl_Position=projectionMatrix*mv;}`,
      fragmentShader: shadowGLSL + `varying vec3 normalView; varying vec3 positionView; uniform vec3 rimColor;
        void main(){float facing=abs(dot(normalize(normalView),normalize(-positionView)));
          float rim=pow(1.-facing,4.)*smoothstep(0.,.25,facing);
          gl_FragColor=vec4(rimColor,rim*.1*directionalShade(positionView.xy));}`,
    }));
    scene.add(atmosphere);

    let pinWidth = 148, pinHeight = 120, viewWidth = 1, viewHeight = 1;
    const pinNodes = [...evidence.regions.map(region=>({...region,layer:'species' as const})),...landPins,...climatePins].map(region => ({
      layer: region.layer,
      // The original species artwork has a cropped geographic extent. Project
      // overlay pins into its texture coordinates just like the colour fields.
      position: new T.Vector3(...(region.layer === 'species'
        ? spherePoint(region.lon, region.lat)
        : spherePoint((495.5 + 2.89 * region.lon) / 1000 * 360 - 180,
            90 - (262.5 - 2.93 * region.lat) / 500 * 180))),
      world: new T.Vector3(), projected: new T.Vector3(), normal: new T.Vector3(),
      label: root.querySelector<HTMLElement>(`[data-pin="${region.id}"]`)!,
      leader: root.querySelector<SVGGElement>(`[data-pin-line="${region.id}"]`)!,
    }));
    const direction = new T.Vector3();
    function updatePins() {
      const occupied: LabelBox[] = [];
      for (const pin of pinNodes) {
        pin.world.copy(pin.position).applyMatrix4(planet.matrixWorld);
        pin.normal.copy(pin.position).transformDirection(planet.matrixWorld);
        direction.copy(camera.position).sub(pin.world).normalize();
        pin.projected.copy(pin.world).project(camera);
        pin.label.hidden = true;
        pin.leader.style.display = 'none';
      }
      // Frontmost regions get priority when the phone viewport is very small.
      const ordered = [...pinNodes].sort((a, b) => b.world.z - a.world.z);
      for (const pin of ordered) {
        const layerOpacity = Math.max(0,(layerBlend[{species:0,land:1,climate:2}[pin.layer]] - .5)*2);
        if (!layerOpacity) continue;
        direction.copy(camera.position).sub(pin.world).normalize();
        const facing = pin.normal.dot(direction);
        if (facing < .16 || Math.abs(pin.projected.x) > 1 || Math.abs(pin.projected.y) > 1) continue;
        const x = (pin.projected.x + 1) * viewWidth / 2;
        const y = (1 - pin.projected.y) * viewHeight / 2;
        const box = placeLabel(x, y, viewWidth, viewHeight, pinWidth, pinHeight, occupied);
        if (!box) continue;
        occupied.push(box);
        pin.label.hidden = false;
        pin.label.style.transform = `translate(${box.x}px,${box.y}px)`;
        const opacity = String(Math.min(1, (facing - .16) / .18)*layerOpacity);
        pin.label.style.opacity = opacity;
        pin.leader.style.display = '';
        pin.leader.style.opacity = opacity;
        const line = pin.leader.querySelector('line')!;
        const dot = pin.leader.querySelector('circle')!;
        line.setAttribute('x1', String(x)); line.setAttribute('y1', String(y));
        line.setAttribute('x2', String(Math.max(box.x, Math.min(box.x + box.width, x))));
        line.setAttribute('y2', String(Math.max(box.y, Math.min(box.y + box.height, y))));
        dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y));
      }
    }

    function draw(time = 0) {
      renderFrame = 0;
      if (failed || document.hidden || !visible) return;
      const dt = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
      previousTime = time;
      layerBlend = blendLayers(layerBlend, activeLayer, dt, reduced.matches);
      layerUniforms.layerWeights.value.set(...layerBlend);
      coast.visible = layerBlend[2] > 0;
      coastInk.opacity = layerBlend[2];
      if (!paused && !dragging) planet.rotation.y += dt * Math.PI * 2 / 120;
      if (!dragging && !reduced.matches && Math.abs(angularVelocity) > .001) {
        planet.rotation.y += angularVelocity * dt;
        angularVelocity *= Math.exp(-dt * 6);
      }
      renderer.render(scene, camera);
      updatePins();
      if (((!paused || Math.abs(angularVelocity) > .001) && !dragging) || !layersSettled(layerBlend, activeLayer)) renderFrame = requestAnimationFrame(draw);
    }
    function wake() {
      if (!renderFrame && !failed && visible && !document.hidden) {
        previousTime = 0;
        renderFrame = requestAnimationFrame(draw);
      }
    }
    function setPaused(value: boolean) {
      paused = value;
      angularVelocity = 0;
      root.dataset.paused = String(value);
      button.textContent = value ? 'Resume rotation' : 'Pause rotation';
      button.setAttribute('aria-pressed', String(value));
      wake();
    }
    layerWake = wake;
    button.hidden = false;
    button.addEventListener('click', () => setPaused(!paused));
    reduced.addEventListener('change', () => setPaused(reduced.matches));
    setPaused(paused);
    viewport.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true;
      pointerX = event.clientX;
      pointerTime = performance.now();
      angularVelocity = 0;
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener('pointermove', event => {
      if (!dragging) return;
      const delta = (event.clientX - pointerX) * .006;
      const now = performance.now();
      angularVelocity = reduced.matches ? 0 : Math.max(-1.5, Math.min(1.5, delta / Math.max(.016, (now-pointerTime)/1000)));
      planet.rotation.y += delta;
      pointerX = event.clientX;
      pointerTime = now;
      wake();
    });
    const endDrag = () => { dragging = false; if (performance.now()-pointerTime > 100) angularVelocity = 0; wake(); };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    viewport.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setPaused(true);
        planet.rotation.y += event.key === 'ArrowLeft' ? -.12 : .12;
        wake();
      }
    });
    resizeObserver = new ResizeObserver(() => {
      const { width, height } = viewport.getBoundingClientRect();
      if (!width || !height) return;
      viewWidth = width; viewHeight = height;
      pinWidth = innerWidth <= 800 ? 126 : 148;
      pinHeight = innerWidth <= 800 ? 112 : 120;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      wake();
    });
    resizeObserver.observe(viewport);
    visibilityObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) wake();
      else { cancelAnimationFrame(renderFrame); renderFrame = 0; }
    });
    visibilityObserver.observe(viewport);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(renderFrame); renderFrame = 0; }
      else wake();
    });
    window.addEventListener('pagehide', event => {
      cancelAnimationFrame(renderFrame); renderFrame = 0;
      if (event.persisted) return;
      resizeObserver?.disconnect(); visibilityObserver?.disconnect();
      geometry.dispose(); earth.material.dispose(); surface.dispose();
      humanTexture.dispose(); climateTexture.dispose();
      coastGeometry.dispose(); coastInk.dispose();
      dotsGeometry.dispose(); dotsMaterial.dispose();
      atmosphere.geometry.dispose(); atmosphere.material.dispose(); renderer.dispose();
    });
    window.addEventListener('pageshow', wake);
    root.dataset.state = 'ready';
    root.dataset.pointCount = String(data.points.length);
  } catch { showFallback(); }
}

if (root) {
  // Load the rendering engine and data only as the visitor approaches this sheet.
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    void mountGlobe(root);
  }, { rootMargin: '100% 0px' });
  observer.observe(root.closest('.thesis-chapter')!);
}
