(() => {
  'use strict';
  const hero = document.querySelector('.hero-animated');
  const scene = hero?.querySelector('.garden-scene');
  const button = hero?.querySelector('.swing-motion-toggle');
  if (!scene || !button) return;
  const rider = scene.querySelector('[data-rider]');
  const ropes = [
    { node: scene.querySelector('[data-rope="near"]'), knot: [1499,120], joint: [1450,229] },
    { node: scene.querySelector('[data-rope="far"]'), knot: [1587,120], joint: [1538,229] }
  ];
  // In the reference garden, -1.8 degrees brings the toe to the stationary fingertips.
  const period = 3550, contact = -1.8 * Math.PI / 180, away = -15 * Math.PI / 180;
  const cx = 1543, cy = 120;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let choice = 'auto', inView = true, elapsed = 0, frame = 0, previous = null;

  function paint(time) {
    const angle = contact + (away - contact) * (1 - Math.cos(2 * Math.PI * time / period)) / 2;
    const a = Math.cos(angle), b = Math.sin(angle);
    const dx = cx - a * cx + b * cy, dy = cy - b * cx - a * cy;
    // Rotate the original portrait, seat, and lower ropes as one rigid object.
    rider.setAttribute('transform', 'matrix(' + [a,b,-b,a,dx,dy].join(' ') + ')');
    // Keep each photographed knot on the branch. Join the rope to the moving seat.
    for (const { node, knot:[kx,ky], joint:[jx,jy] } of ropes) {
      const x = jx-kx, y = jy-ky, len = x*x+y*y;
      const u = a*jx-b*jy+dx-kx, v = b*jx+a*jy+dy-ky;
      const c = (u*x+v*y)/len, s = (v*x-u*y)/len;
      node.setAttribute('transform', 'matrix(' + [c,s,-s,c,kx-c*kx+s*ky,ky-s*kx-c*ky].join(' ') + ')');
    }
  }
  function tick(stamp) {
    if (previous !== null) elapsed = (elapsed + stamp - previous) % period;
    previous = stamp;
    paint(elapsed);
    frame = requestAnimationFrame(tick);
  }
  const wantsMotion = () => choice === 'play' || (choice === 'auto' && !reduced.matches);
  function sync() {
    const playing = wantsMotion() && inView && !document.hidden;
    if (playing && !frame) { previous = null; frame = requestAnimationFrame(tick); }
    if (!playing && frame) { cancelAnimationFrame(frame); frame = 0; previous = null; }
    hero.dataset.motion = playing ? 'playing' : 'paused';
    hero.dataset.motionChoice = choice;
    button.textContent = wantsMotion() ? 'Pause animation' : 'Play animation';
    button.hidden = false;
  }
  button.addEventListener('click', () => { choice = wantsMotion() ? 'pause' : 'play'; sync(); });
  if (reduced.addEventListener) reduced.addEventListener('change',sync);
  else reduced.addListener(sync);
  document.addEventListener('visibilitychange',sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting; sync();
  }).observe(hero);
  paint(0); sync();
})();
