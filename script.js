/* ---------- Three.js particle hero ---------- */
(function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0b1020, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1020, 0.0012);
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 3000);
  camera.position.z = 600;

  const palette = [new THREE.Color("#7C5CFF"), new THREE.Color("#22D3EE"), new THREE.Color("#F472B6")];
  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 2500 : 6000;

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    // distribute on a twisted galaxy-like disc
    const r = Math.pow(Math.random(), 0.6) * 700;
    const arm = (i % 3) * ((Math.PI * 2) / 3);
    const angle = arm + r * 0.008 + (Math.random() - 0.5) * 0.9;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120 * (1 - r / 900);
    positions[i * 3 + 2] = Math.sin(angle) * r;

    const c = palette[i % 3].clone().lerp(palette[(i + 1) % 3], Math.random() * 0.4);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // soft round sprite
  const sprite = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.4, "rgba(255,255,255,.5)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const mat = new THREE.PointsMaterial({
    size: 6, map: sprite, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9,
  });
  const galaxy = new THREE.Points(geo, mat);
  galaxy.rotation.x = 1.0;
  scene.add(galaxy);

  // background star dust
  const dustGeo = new THREE.BufferGeometry();
  const dust = new Float32Array(1500 * 3);
  for (let i = 0; i < dust.length; i++) dust[i] = (Math.random() - 0.5) * 2400;
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 2, color: 0x9aa0bf, transparent: true, opacity: 0.5, map: sprite, depthWrite: false,
  }));
  scene.add(dustPts);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    galaxy.rotation.y = t * 0.06;
    galaxy.rotation.x = 1.0 + mouse.y * 0.15;
    galaxy.rotation.z = mouse.x * 0.12;
    dustPts.rotation.y = -t * 0.01;
    const scrollY = window.scrollY;
    camera.position.z = 600 - Math.min(scrollY, 800) * 0.35;
    mat.size = 6 + Math.sin(t * 1.5) * 0.6;
    renderer.render(scene, camera);
  })();
})();

/* ---------- Scroll reveal ---------- */
const revealObs = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visible"); revealObs.unobserve(e.target); }
  }),
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((el) => revealObs.observe(el));

/* ---------- Counters ---------- */
const countObs = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  const el = e.target, end = +el.dataset.count, start = performance.now(), dur = 1600;
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.floor(end * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(start);
  countObs.unobserve(el);
}), { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => countObs.observe(el));

/* ---------- Typing effect ---------- */
(function typing() {
  const el = document.querySelector(".typed");
  if (!el) return;
  const words = JSON.parse(el.dataset.words);
  let w = 0, c = 0, del = false;
  (function step() {
    const word = words[w];
    el.textContent = word.slice(0, c);
    if (!del && c < word.length) c++;
    else if (del && c > 0) c--;
    else if (!del) { del = true; return setTimeout(step, 1600); }
    else { del = false; w = (w + 1) % words.length; }
    setTimeout(step, del ? 45 : 90);
  })();
})();

/* ---------- Nav ---------- */
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 40), { passive: true });
const menuBtn = document.querySelector(".menu-btn");
const links = document.querySelector(".nav-links");
menuBtn.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  menuBtn.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
});
links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  links.classList.remove("open"); menuBtn.classList.remove("open");
}));

/* ---------- Cursor glow + card spotlight + tilt ---------- */
const glow = document.querySelector(".cursor-glow");
window.addEventListener("pointermove", (e) => {
  glow.style.left = e.clientX + "px";
  glow.style.top = e.clientY + "px";
});
document.querySelectorAll(".skill-card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
});
document.querySelectorAll(".project").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
  });
  card.addEventListener("pointerleave", () => (card.style.transform = ""));
});

document.getElementById("year").textContent = new Date().getFullYear();
