/* ==========================================================
   INTERACTIONS — cursor, trail, parallax, tilt, reveals, scene
   ========================================================== */

(() => {
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- Custom Cursor ---------- */
  if (!isCoarse) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let dx = mx, dy = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
    });

    function loop() {
      dx += (mx - dx) * 0.5;
      dy += (my - dy) * 0.5;
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    /* Hover targets */
    const hoverSel = 'a, button, .project-card, .skill-cell, .blog-item, .ed-item, .aw-item, .tl-item';
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest(hoverSel);
      if (target) {
        if (target.matches('a, button')) {
          ring.classList.add('is-hover');
        } else {
          ring.classList.add('is-drag');
        }
      }
      if (e.target.closest('p, h1, h2, h3, h4, .pc-desc, .hero-tag, .about-body, .blog-item .excerpt')) {
        ring.classList.add('is-text');
      }
    });
    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest(hoverSel);
      if (target) {
        ring.classList.remove('is-hover', 'is-drag');
      }
      if (e.target.closest('p, h1, h2, h3, h4, .pc-desc, .hero-tag, .about-body, .blog-item .excerpt')) {
        ring.classList.remove('is-text');
      }
    });

    /* Trail */
    let lastTrail = 0;
    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastTrail < 30) return;
      lastTrail = now;
      const d = document.createElement('div');
      d.className = 'trail-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      const drift = (Math.random() - 0.5) * 20;
      d.animate([
        { opacity: 0.9, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: `translate(calc(-50% + ${drift}px), calc(-50% + 20px)) scale(0.3)` }
      ], { duration: 800, easing: 'cubic-bezier(.4,0,.2,1)' });
      setTimeout(() => d.remove(), 800);
    });
  }

  /* ---------- Scroll Reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal, .reveal-stagger').forEach((el) => io.observe(el));

  /* ---------- Hero Mouse Parallax for floating icons ---------- */
  const heroSection = document.querySelector('.hero');
  const heroIcons = document.querySelectorAll('.hero-icon');
  if (heroSection && heroIcons.length) {
    let hmx = 0, hmy = 0;
    let cmx = 0, cmy = 0;
    heroSection.addEventListener('mousemove', (e) => {
      const r = heroSection.getBoundingClientRect();
      hmx = (e.clientX - r.left - r.width / 2) / r.width;
      hmy = (e.clientY - r.top - r.height / 2) / r.height;
    });
    function parallaxLoop() {
      cmx += (hmx - cmx) * 0.08;
      cmy += (hmy - cmy) * 0.08;
      heroIcons.forEach((icon) => {
        const depth = parseFloat(icon.dataset.depth || '1');
        const rot = parseFloat(icon.dataset.rot || '0');
        icon.style.transform = `translate3d(${cmx * 60 * depth}px, ${cmy * 60 * depth}px, 0) rotate(${rot + cmx * 10 * depth}deg)`;
      });
      requestAnimationFrame(parallaxLoop);
    }
    parallaxLoop();
  }

  /* ---------- Project Card 3D Tilt ---------- */
  document.querySelectorAll('.project-card').forEach((card) => {
    let tx = 0, ty = 0, ctx = 0, cty = 0;
    let active = false;
    card.addEventListener('mouseenter', () => { active = true; });
    card.addEventListener('mouseleave', () => {
      active = false;
      tx = 0; ty = 0;
    });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      tx = (py - 0.5) * -10;
      ty = (px - 0.5) * 10;
      card.style.setProperty('--mx', (px * 100) + '%');
      card.style.setProperty('--my', (py * 100) + '%');
    });
    function tiltLoop() {
      ctx += (tx - ctx) * 0.12;
      cty += (ty - cty) * 0.12;
      card.style.transform = `perspective(1200px) rotateX(${ctx}deg) rotateY(${cty}deg)`;
      requestAnimationFrame(tiltLoop);
    }
    tiltLoop();
  });

  /* ---------- Marquee Duplicate (seamless) ---------- */
  document.querySelectorAll('.marquee-track').forEach((track) => {
    const items = Array.from(track.children);
    items.forEach((it) => track.appendChild(it.cloneNode(true)));
  });

  /* ---------- Live Clock ---------- */
  const clocks = document.querySelectorAll('[data-clock]');
  function updateClock() {
    if (!clocks.length) return;
    const d = new Date();
    const opts = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const text = d.toLocaleTimeString('en-GB', opts) + ' WIB';
    clocks.forEach((c) => { c.textContent = text; });
  }
  setInterval(updateClock, 1000); updateClock();

  /* ---------- Smooth Anchor Scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - 20, behavior: 'smooth' });
    });
  });

  /* ---------- Scroll-driven rotation for hero h1 ---------- */
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroTitle.style.transform = `translateY(${y * 0.15}px)`;
      heroTitle.style.opacity = Math.max(0, 1 - y / 600);
    });
  }
})();
