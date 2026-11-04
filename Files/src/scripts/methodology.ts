import { systemDescription } from '../data/methodology';

document.querySelectorAll<HTMLElement>('.methodology-scene').forEach(scene => {
  const board = scene.querySelector<HTMLElement>('.methodology-board')!;
  const hub = scene.querySelector<HTMLButtonElement>('.methodology-hub')!;
  const nodes = [...scene.querySelectorAll<HTMLElement>('.methodology-node')];
  const edges = [...scene.querySelectorAll<SVGPathElement>('.methodology-edge')];
  const title = scene.querySelector<HTMLElement>('.methodology-detail strong')!;
  const body = scene.querySelector<HTMLElement>('.methodology-detail p')!;
  let pinned = false, nearby = false, hubFocused = false;
  const showPrototype = () => {
    const visible = pinned || nearby || hubFocused;
    hub.classList.toggle('show-prototype', visible);
    hub.setAttribute('aria-expanded', String(visible));
  };
  function selectNode(node?: HTMLElement) {
    title.textContent = node ? node.dataset.label || node.innerText.replace(/\s+/g, ' ').trim() : 'One system. Three taxonomies.';
    body.textContent = node?.dataset.description || systemDescription;
    nodes.forEach(item => {
      item.classList.toggle('is-active', item === node);
      item.classList.toggle('show-preview', item === node);
    });
    edges.forEach(edge => edge.classList.toggle('is-active', Boolean(node && (edge.dataset.from === node.dataset.node || edge.dataset.to === node.dataset.node))));
  }
  nodes.forEach(node => {
    node.addEventListener('pointerenter', () => selectNode(node));
    node.addEventListener('focus', () => selectNode(node));
    node.addEventListener('click', () => selectNode(node));
    node.addEventListener('pointerleave', () => { if (document.activeElement !== node) node.classList.toggle('show-preview', false); });
    node.addEventListener('blur', () => node.classList.toggle('show-preview', false));
  });
  board.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const box = hub.getBoundingClientRect();
    nearby = Math.hypot(event.clientX - box.left - box.width / 2, event.clientY - box.top - box.height / 2) < box.width * .72;
    showPrototype();
  });
  board.addEventListener('pointerleave', () => { nearby = false; showPrototype(); });
  hub.addEventListener('focus', () => { hubFocused = true; selectNode(); showPrototype(); });
  hub.addEventListener('blur', () => { hubFocused = false; showPrototype(); });
  hub.addEventListener('click', () => {
    pinned = !pinned; nearby = false; hubFocused = false; selectNode(); showPrototype();
  });
  scene.addEventListener('keydown', event => {
    if (event.key === 'Escape') { pinned = false; nearby = false; hubFocused = false; showPrototype(); selectNode(); }
  });
});
