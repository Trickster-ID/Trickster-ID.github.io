/* ==========================================================
   3D SCENE — emerald crystal that responds to scroll + mouse
   ========================================================== */

(() => {
  const mount = document.querySelector('.hero-canvas');
  if (!mount || typeof THREE === 'undefined') return;

  /* Read palette from CSS variables */
  function readPalette() {
    const cs = getComputedStyle(document.body);
    return {
      primary:   cs.getPropertyValue('--emerald').trim()      || '#10b981',
      soft:      cs.getPropertyValue('--emerald-soft').trim() || '#34d399',
      secondary: cs.getPropertyValue('--cyan').trim()         || '#5eead4',
    };
  }
  const P0 = readPalette();
  const C = {
    primary:   new THREE.Color(P0.primary),
    soft:      new THREE.Color(P0.soft),
    secondary: new THREE.Color(P0.secondary),
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  /* group for everything */
  const group = new THREE.Group();
  scene.add(group);

  /* Core icosahedron - solid faceted */
  const coreGeo = new THREE.IcosahedronGeometry(1.4, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: C.primary.clone().multiplyScalar(0.12),
    emissive: C.primary.clone().multiplyScalar(0.35),
    metalness: 0.9,
    roughness: 0.15,
    flatShading: true,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  /* Wireframe shell */
  const wireGeo = new THREE.IcosahedronGeometry(1.5, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: C.primary,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  group.add(wire);

  /* Outer ring of dots */
  const outerGeo = new THREE.IcosahedronGeometry(2.2, 2);
  const positions = outerGeo.attributes.position;
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', positions);
  const dotMat = new THREE.PointsMaterial({
    color: C.secondary,
    size: 0.03,
    transparent: true,
    opacity: 0.8,
  });
  const dots = new THREE.Points(dotGeo, dotMat);
  group.add(dots);

  /* Floating torus */
  const torusGeo = new THREE.TorusGeometry(2.6, 0.015, 8, 100);
  const torusMat = new THREE.MeshBasicMaterial({
    color: C.secondary,
    transparent: true,
    opacity: 0.4,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.rotation.x = Math.PI / 2.5;
  group.add(torus);

  const torus2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, 0.008, 8, 100),
    new THREE.MeshBasicMaterial({ color: C.primary, transparent: true, opacity: 0.3 })
  );
  torus2.rotation.x = -Math.PI / 3;
  torus2.rotation.y = Math.PI / 4;
  group.add(torus2);

  /* Particles in background */
  const partCount = 600;
  const partGeo = new THREE.BufferGeometry();
  const partPos = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    const r = 4 + Math.random() * 5;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    partPos[i * 3]     = r * Math.sin(p) * Math.cos(t);
    partPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    partPos[i * 3 + 2] = r * Math.cos(p);
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
  const partMat = new THREE.PointsMaterial({
    color: C.secondary,
    size: 0.018,
    transparent: true,
    opacity: 0.5,
  });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  /* Lighting */
  const ambient = new THREE.AmbientLight(0x0a1411, 0.6);
  scene.add(ambient);
  const dl = new THREE.DirectionalLight(C.primary, 2.5);
  dl.position.set(3, 4, 5);
  scene.add(dl);
  const pl = new THREE.PointLight(C.secondary, 2, 10);
  pl.position.set(-3, 2, 3);
  scene.add(pl);
  const rim = new THREE.DirectionalLight(C.soft, 1.2);
  rim.position.set(-2, -1, -3);
  scene.add(rim);

  /* Mouse + scroll */
  let mx = 0, my = 0;
  let cmx = 0, cmy = 0;
  let scrollY = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  function onResize() {
    const w = mount.clientWidth, h = mount.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  const start = performance.now();
  function animate() {
    const t = (performance.now() - start) * 0.001;
    cmx += (mx - cmx) * 0.05;
    cmy += (my - cmy) * 0.05;

    /* group rotation: scroll-driven base + mouse parallax */
    const sFactor = scrollY * 0.002;
    group.rotation.y = t * 0.3 + cmx * 0.6 + sFactor;
    group.rotation.x = t * 0.15 + cmy * 0.4 + sFactor * 0.5;

    /* core spins slowly */
    core.rotation.y -= 0.003;
    core.rotation.x += 0.002;

    /* wire counter-rotates */
    wire.rotation.y += 0.005;
    wire.rotation.z += 0.002;

    /* dots breathe */
    const breathe = 1 + Math.sin(t * 1.5) * 0.04;
    dots.scale.setScalar(breathe);

    /* torus float */
    torus.rotation.z = t * 0.4;
    torus2.rotation.z = -t * 0.3;

    /* particles drift */
    particles.rotation.y = t * 0.02 + sFactor * 0.3;

    /* scale-down on scroll */
    const fadeScale = Math.max(0.6, 1 - scrollY / 2000);
    group.scale.setScalar(fadeScale);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  /* ============= CONTACT SCENE (smaller torus knot) ============= */
  const cMount = document.querySelector('.contact-canvas');
  if (cMount) {
    const cScene = new THREE.Scene();
    const cCam = new THREE.PerspectiveCamera(50, cMount.clientWidth / cMount.clientHeight, 0.1, 100);
    cCam.position.z = 5;
    const cRen = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    cRen.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cRen.setSize(cMount.clientWidth, cMount.clientHeight);
    cRen.setClearColor(0x000000, 0);
    cMount.appendChild(cRen.domElement);

    const knotGeo = new THREE.TorusKnotGeometry(1.2, 0.1, 200, 16);
    const knotMat = new THREE.MeshStandardMaterial({
      color: C.primary.clone().multiplyScalar(0.2),
      emissive: C.primary.clone(),
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    cScene.add(knot);

    cScene.add(new THREE.AmbientLight(0x0a1411, 0.5));
    const cDl = new THREE.DirectionalLight(C.secondary, 2);
    cDl.position.set(2, 2, 4);
    cScene.add(cDl);
    const cPl = new THREE.PointLight(C.primary, 2, 8);
    cPl.position.set(-2, -2, 2);
    cScene.add(cPl);

    window.addEventListener('resize', () => {
      cCam.aspect = cMount.clientWidth / cMount.clientHeight;
      cCam.updateProjectionMatrix();
      cRen.setSize(cMount.clientWidth, cMount.clientHeight);
    });

    function cAnimate() {
      const t = performance.now() * 0.0005;
      knot.rotation.x = t;
      knot.rotation.y = t * 0.7;
      knot.rotation.z = cmx * 0.5;
      cRen.render(cScene, cCam);
      requestAnimationFrame(cAnimate);
    }
    cAnimate();

    /* expose for tweaks repaint */
    window.__sceneApplyPalette = (p) => {
      C.primary.set(p.primary);
      C.soft.set(p.soft);
      C.secondary.set(p.secondary);
      coreMat.color.copy(C.primary).multiplyScalar(0.12);
      coreMat.emissive.copy(C.primary).multiplyScalar(0.35);
      wireMat.color.copy(C.primary);
      dotMat.color.copy(C.secondary);
      torusMat.color.copy(C.secondary);
      torus2.material.color.copy(C.primary);
      partMat.color.copy(C.secondary);
      dl.color.copy(C.primary);
      pl.color.copy(C.secondary);
      rim.color.copy(C.soft);
      knotMat.color.copy(C.primary).multiplyScalar(0.2);
      knotMat.emissive.copy(C.primary);
      cDl.color.copy(C.secondary);
      cPl.color.copy(C.primary);
    };
  }
})();
