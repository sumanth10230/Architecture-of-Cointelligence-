import archive from '../data/botanical-cards.json';
import { CARD_COUNT, CARD_HEIGHT, CARD_WIDTH, CAMERA_Z, cardDefinition, sampleCard, gridLayout, connectionPairs, networkOpacity, pulseProgress, backgroundCount, sampleBackground, backgroundPairs, cardPhase } from './card-motion';

// Use 80 cards in the spatial scene; retain all 88 in the inspectable archive.
const cards = archive.slice(0, CARD_COUNT);

const root = document.querySelector<HTMLElement>('[data-cards]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

async function mountCards(root: HTMLElement) {
  const section = root.closest<HTMLElement>('.thesis-chapter')!;
  const viewport = root.querySelector<HTMLElement>('.cards-viewport')!;
  const status = root.querySelector<HTMLElement>('.cards-status')!;
  let time = Number(section.dataset.time) || 0;
  let frame = 0;
  let visible = false;
  let failed = false;
  let renderer: any;
  let resizeObserver: ResizeObserver | undefined;
  let visibilityObserver: IntersectionObserver | undefined;
  const resources: { dispose: () => void }[] = [];
  const fail = () => {
    failed = true;
    cancelAnimationFrame(frame); frame = 0;
    root.dataset.state = 'fallback';
    status.textContent = 'Still archive. All 88 cards are available below.';
    renderer?.domElement.remove();
    renderer?.dispose();
    resources.splice(0).forEach(item => item.dispose());
    resizeObserver?.disconnect(); visibilityObserver?.disconnect();
  };
  try {
    if (cards.length !== CARD_COUNT) throw new Error('The scene requires 80 supplied cards.');
    const T: any = await import('../../vendor/three/three.module.js');
    if (failed) return;
    renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setClearColor(0xfafaf8, 1);
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth <= 800 ? 1.25 : 1.75));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.domElement.addEventListener('webglcontextlost', (event: Event) => { event.preventDefault(); fail(); }, { once: true });
    viewport.append(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(24, 1, .15, 360);
    camera.position.set(0, 0, CAMERA_Z);
    let layout = gridLayout(innerWidth / innerHeight);
    const geometry = new T.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
    resources.push(geometry);
    const groups = [new T.Group(), new T.Group()];
    scene.add(...groups);
    const meshes = cards.map((card, index) => {
      const definition = cardDefinition(index, layout);
      const material = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: true, toneMapped: false });
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(definition.x, definition.y, definition.baseZ);
      // Aspect ratios have been checked against the supplied archive. All are 7:6.
      mesh.userData.cardId = card.id;
      groups[definition.layer].add(mesh);
      resources.push(material);
      return mesh;
    });
    const compact = innerWidth <= 800 || Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    const backdropCount = backgroundCount(compact);
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = 2048; atlasCanvas.height = 1024;
    const atlasContext = atlasCanvas.getContext('2d')!;
    atlasContext.fillStyle = '#fafaf8'; atlasContext.fillRect(0, 0, 2048, 1024);
    const atlasTexture = new T.CanvasTexture(atlasCanvas);
    atlasTexture.generateMipmaps = false;
    atlasTexture.minFilter = atlasTexture.magFilter = T.LinearFilter;
    const backdropGeometry = geometry.clone();
    const tiles = new Float32Array(backdropCount * 2);
    for (let i = 0; i < backdropCount; i++) {
      tiles[i * 2] = (i % 88) % 11;
      tiles[i * 2 + 1] = Math.floor((i % 88) / 11);
    }
    backdropGeometry.setAttribute('tile', new T.InstancedBufferAttribute(tiles, 2));
    backdropGeometry.setAttribute('strength', new T.InstancedBufferAttribute(new Float32Array(backdropCount), 1).setUsage(T.DynamicDrawUsage));
    const backdropMaterial = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true,
      uniforms: { atlas: { value: atlasTexture } },
      vertexShader: `attribute vec2 tile; attribute float strength; varying vec2 imageUV; varying float alpha;
        void main(){imageUV=vec2((tile.x*140.+2.+uv.x*136.)/2048.,1.-(tile.y*120.+2.+(1.-uv.y)*116.)/1024.);
        alpha=strength; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D atlas; varying vec2 imageUV; varying float alpha;
        void main(){vec3 col=texture2D(atlas,imageUV).rgb;gl_FragColor=vec4(mix(col,vec3(.98,.98,.973),.14),alpha);}`,
    });
    const backdrop = new T.InstancedMesh(backdropGeometry, backdropMaterial, backdropCount);
    backdrop.instanceMatrix.setUsage(T.DynamicDrawUsage);
    backdrop.frustumCulled = false;
    backdrop.renderOrder = -1;
    scene.add(backdrop);
    resources.push(atlasTexture, backdropGeometry, backdropMaterial);
    const instanceTransform = new T.Object3D();
    let atlasReady = false;
    let pairs = [...connectionPairs(layout), ...backgroundPairs(backdropCount, layout, compact)];
    // One line draw call and one point draw call for the entire connected field.
    const wireGeometry = new T.BufferGeometry();
    const pulseGeometry = new T.BufferGeometry();
    const wireMaterial = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true,
      vertexShader: `attribute float strength; varying float alpha;
        void main(){alpha=strength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying float alpha;void main(){gl_FragColor=vec4(.035,.035,.035,alpha*.32);}`,
    });
    const pulseMaterial = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true,
      uniforms: { pixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute float strength; varying float alpha; uniform float pixelRatio;
        void main(){alpha=strength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=3.8*pixelRatio;}`,
      fragmentShader: `varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.015,.015,.015,alpha*(1.-smoothstep(.25,.5,d)));}`,
    });
    const wires = new T.LineSegments(wireGeometry, wireMaterial);
    const pulses = new T.Points(pulseGeometry, pulseMaterial);
    wires.frustumCulled = pulses.frustumCulled = false;
    scene.add(wires, pulses);
    resources.push(wireGeometry, pulseGeometry, wireMaterial, pulseMaterial);
    function allocateNetwork() {
      pairs = [...connectionPairs(layout), ...backgroundPairs(backdropCount, layout, compact)];
      wireGeometry.setAttribute('position', new T.BufferAttribute(new Float32Array(pairs.length * 6), 3).setUsage(T.DynamicDrawUsage));
      wireGeometry.setAttribute('strength', new T.BufferAttribute(new Float32Array(pairs.length * 2), 1).setUsage(T.DynamicDrawUsage));
      pulseGeometry.setAttribute('position', new T.BufferAttribute(new Float32Array(pairs.length * 3), 3).setUsage(T.DynamicDrawUsage));
      pulseGeometry.setAttribute('strength', new T.BufferAttribute(new Float32Array(pairs.length), 1).setUsage(T.DynamicDrawUsage));
    }
    allocateNetwork();
    const render = () => {
      frame = 0;
      if (failed || !visible || document.hidden) return;
      const sampleTime = reduced.matches ? 0 : cardPhase(time);
      const states = meshes.map((mesh, index) => {
        const state = sampleCard(index, sampleTime, layout);
        mesh.position.z = state.z;
        mesh.material.opacity = state.opacity;
        mesh.visible = state.opacity > .001 && state.z < CAMERA_Z - .15 && Boolean(mesh.material.map);
        return state;
      });
      backdrop.visible = atlasReady && !reduced.matches && sampleTime > 1.15 && sampleTime < 6;
      for (let i = 0; i < backdropCount; i++) {
        const state = sampleBackground(i, sampleTime, layout, compact);
        instanceTransform.position.set(state.x, state.y, state.z);
        instanceTransform.scale.setScalar(state.scale);
        instanceTransform.updateMatrix();
        backdrop.setMatrixAt(i, instanceTransform.matrix);
        backdropGeometry.attributes.strength.setX(i, state.opacity);
        states.push({ ...state, opacity: atlasReady ? state.opacity : 0 });
      }
      backdrop.instanceMatrix.needsUpdate = true;
      backdropGeometry.attributes.strength.needsUpdate = true;
      const reveal = reduced.matches ? 0 : networkOpacity(sampleTime);
      wires.visible = pulses.visible = reveal > 0;
      if (reveal > 0) {
        const wp = wireGeometry.attributes.position, wa = wireGeometry.attributes.strength;
        const pp = pulseGeometry.attributes.position, pa = pulseGeometry.attributes.strength;
        pairs.forEach(([a, b], edge) => {
          const start = states[a], end = states[b];
          const rearEdge = a >= CARD_COUNT;
          const strength = reveal * Math.min(start.opacity, end.opacity) * (rearEdge ? .42 : 1);
          wp.setXYZ(edge * 2, start.x, start.y, start.z - .008);
          wp.setXYZ(edge * 2 + 1, end.x, end.y, end.z - .008);
          wa.setX(edge * 2, strength); wa.setX(edge * 2 + 1, strength);
          const u = pulseProgress(edge, sampleTime);
          pp.setXYZ(edge, start.x + (end.x-start.x)*u, start.y + (end.y-start.y)*u, start.z + (end.z-start.z)*u - .004);
          pa.setX(edge, strength * (rearEdge ? 1.65 : 1));
        });
        wp.needsUpdate = wa.needsUpdate = pp.needsUpdate = pa.needsUpdate = true;
      }
      renderer.render(scene, camera);
      root.dataset.time = (reduced.matches ? 0 : time).toFixed(4);
    };
    // One render per requested scroll/resize/load update. No clock-driven animation loop.
    const requestRender = () => { if (!frame && !failed && visible && !document.hidden) frame = requestAnimationFrame(render); };
    section.addEventListener('scene-progress', event => {
      time = (event as CustomEvent<{ time: number }>).detail.time;
      requestRender();
    });
    reduced.addEventListener('change', requestRender);
    resizeObserver = new ResizeObserver(() => {
      const { width, height } = viewport.getBoundingClientRect();
      if (!width || !height) return;
      layout = gridLayout(width / height);
      camera.fov = 2 * Math.atan(layout.viewHeight / (2 * CAMERA_Z)) * 180 / Math.PI;
      camera.aspect = width / height;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      // Reflow only on resize; all X/Y values stay fixed throughout scrolling.
      meshes.forEach((mesh, index) => {
        const definition = cardDefinition(index, layout);
        mesh.position.x = definition.x; mesh.position.y = definition.y;
      });
      allocateNetwork();
      renderer.setSize(width, height, false);
      requestRender();
    });
    resizeObserver.observe(viewport);
    visibilityObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) requestRender();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    visibilityObserver.observe(viewport);
    document.addEventListener('visibilitychange', requestRender);
    window.addEventListener('pageshow', requestRender);
    window.addEventListener('pagehide', event => {
      cancelAnimationFrame(frame); frame = 0;
      if (event.persisted) return;
      failed = true;
      resizeObserver?.disconnect(); visibilityObserver?.disconnect();
      resources.splice(0).forEach(item => item.dispose()); renderer.dispose();
    });

    const loader = new T.TextureLoader();
    let cursor = 0;
    let loaded = 0;
    // Four texture requests at a time, with smaller GPU textures on mobile.
    const mobileTextures = innerWidth <= 800 || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    async function worker() {
      while (cursor < archive.length && !failed) {
        const index = cursor++;
        const card = archive[index];
        const texture = await loader.loadAsync(mobileTextures ? card.mobileImage : card.image);
        if (failed) { texture.dispose(); return; }
        texture.colorSpace = T.SRGBColorSpace;
        texture.minFilter = T.LinearMipmapLinearFilter;
        texture.magFilter = T.LinearFilter;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        atlasContext.save();
        const tileX = (index % 11) * 140, tileY = Math.floor(index / 11) * 120;
        atlasContext.beginPath(); atlasContext.rect(tileX, tileY, 140, 120); atlasContext.clip();
        atlasContext.filter = 'none';
        atlasContext.drawImage(texture.image, tileX + 2, tileY + 2, 136, 116);
        atlasContext.restore();
        if (index < CARD_COUNT) {
          meshes[index].material.map = texture;
          meshes[index].material.needsUpdate = true;
          resources.push(texture);
        } else texture.dispose();
        loaded++;
        if (loaded % 16 === 0) status.textContent = `Preparing the botanical archive · ${loaded} / 88`;
        requestRender();
      }
    }
    await Promise.all(Array.from({ length: 4 }, () => worker()));
    if (failed) return;
    atlasTexture.needsUpdate = true;
    atlasReady = true;
    root.dataset.state = 'ready';
    root.dataset.cardCount = String(meshes.length);
    root.dataset.backgroundCount = String(backdropCount);
    status.textContent = '';
    requestRender();
  } catch { fail(); }
}

if (root) {
  // Begin preparing while the visitor is still on the preceding globe sheet.
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    void mountCards(root);
  }, { rootMargin: '200% 0px' });
  observer.observe(root.closest('.thesis-chapter')!);
}
