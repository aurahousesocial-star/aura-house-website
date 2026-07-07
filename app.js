// ===========================
// AURA HOUSE — app.js
// ADA/WCAG 2.1 AA Compliant
// ===========================

document.addEventListener('DOMContentLoaded', () => {

  // ---- 1. MARQUEE PAUSE/PLAY (WCAG 2.2.2) ----
  const marqueeTrack = document.querySelector('.marquee-track');
  const pauseBtn = document.querySelector('.marquee-pause');

  if (pauseBtn && marqueeTrack) {
    let isPaused = false;
    pauseBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      marqueeTrack.style.animationPlayState = isPaused ? 'paused' : 'running';
      pauseBtn.setAttribute('aria-pressed', isPaused.toString());
      pauseBtn.setAttribute('aria-label', isPaused ? 'Play scrolling banner' : 'Pause scrolling banner');
      pauseBtn.querySelector('span').textContent = isPaused ? '▶' : '⏸';
    });

    // Also pause on hover (bonus UX)
    const strip = document.querySelector('.marquee-strip');
    strip.addEventListener('mouseenter', () => {
      if (!isPaused) marqueeTrack.style.animationPlayState = 'paused';
    });
    strip.addEventListener('mouseleave', () => {
      if (!isPaused) marqueeTrack.style.animationPlayState = 'running';
    });
  }


  // ---- 2. DRAGGABLE POLAROIDS (with keyboard support) ----
  const polaroids = document.querySelectorAll('.polaroid');

  polaroids.forEach(polaroid => {
    let isDragging = false;
    let startX, startY, origX, origY;

    const computedStyle = window.getComputedStyle(polaroid);
    const matrix = new DOMMatrix(computedStyle.transform);
    const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);

    // Mouse drag
    polaroid.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = polaroid.getBoundingClientRect();
      const parent = polaroid.parentElement.getBoundingClientRect();
      origX = rect.left - parent.left;
      origY = rect.top - parent.top;
      polaroid.style.position = 'absolute';
      polaroid.style.left = origX + 'px';
      polaroid.style.top = origY + 'px';
      polaroid.style.zIndex = 100;
      polaroid.style.cursor = 'grabbing';
      polaroid.style.transform = `rotate(${angle}deg)`;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      polaroid.style.left = (origX + e.clientX - startX) + 'px';
      polaroid.style.top = (origY + e.clientY - startY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      polaroid.style.cursor = 'grab';
      polaroid.style.zIndex = '';
    });

    // Keyboard drag (WCAG 2.1.1 — keyboard accessible)
    polaroid.addEventListener('keydown', (e) => {
      const STEP = 20;
      const currentLeft = parseInt(polaroid.style.left) || 0;
      const currentTop = parseInt(polaroid.style.top) || 0;

      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();

      if (polaroid.style.position !== 'absolute') {
        const rect = polaroid.getBoundingClientRect();
        const parent = polaroid.parentElement.getBoundingClientRect();
        polaroid.style.position = 'absolute';
        polaroid.style.left = (rect.left - parent.left) + 'px';
        polaroid.style.top = (rect.top - parent.top) + 'px';
        polaroid.style.transform = `rotate(${angle}deg)`;
      }

      const moves = {
        ArrowUp:    [0, -STEP],
        ArrowDown:  [0, STEP],
        ArrowLeft:  [-STEP, 0],
        ArrowRight: [STEP, 0],
      };
      const [dx, dy] = moves[e.key];
      polaroid.style.left = (currentLeft + dx) + 'px';
      polaroid.style.top  = (currentTop + dy) + 'px';
      polaroid.style.zIndex = 100;

      // Announce movement to screen readers
      polaroid.setAttribute('aria-label',
        polaroid.getAttribute('aria-label').replace(/ \(moved\)$/, '') + ' (moved)'
      );
    });

    // Touch drag
    polaroid.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      const rect = polaroid.getBoundingClientRect();
      const parent = polaroid.parentElement.getBoundingClientRect();
      origX = rect.left - parent.left;
      origY = rect.top - parent.top;
      polaroid.style.position = 'absolute';
      polaroid.style.left = origX + 'px';
      polaroid.style.top = origY + 'px';
      polaroid.style.zIndex = 100;
      polaroid.style.transform = `rotate(${angle}deg)`;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      polaroid.style.left = (origX + touch.clientX - startX) + 'px';
      polaroid.style.top  = (origY + touch.clientY - startY) + 'px';
    }, { passive: true });

    document.addEventListener('touchend', () => {
      isDragging = false;
      polaroid.style.zIndex = '';
    });
  });


  // ---- 3. BRING POLAROID FORWARD ON CLICK/FOCUS ----
  polaroids.forEach(p => {
    const bringForward = () => {
      polaroids.forEach(other => { if (other !== p) other.style.zIndex = ''; });
      p.style.zIndex = 50;
    };
    p.addEventListener('click', bringForward);
    p.addEventListener('focus', bringForward);
  });


  // ---- 4. SCROLL REVEAL ----
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const revealEls = document.querySelectorAll(
      '.rip-paper, .polaroid, .col, .visit-card, .timeline-frame'
    );

    const style = document.createElement('style');
    style.textContent = `
      .hidden-until-reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .hidden-until-reveal.revealed {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => {
      el.classList.add('hidden-until-reveal');
      observer.observe(el);
    });
  }


  // ---- 5. LOGO GLITCH (respects reduced motion) ----
  const logo = document.querySelector('.logo');
  if (logo && !prefersReducedMotion) {
    setInterval(() => {
      if (Math.random() < 0.15) {
        logo.style.textShadow = `${Math.random() * 8 - 4}px ${Math.random() * 4}px 0 #9a0000, ${Math.random() * 12 - 6}px ${Math.random() * 4}px 0 rgba(212,160,23,0.5)`;
        setTimeout(() => {
          logo.style.textShadow = '4px 4px 0 #9a0000, 8px 8px 0 rgba(154,0,0,0.3)';
        }, 120);
      }
    }, 2000);
  }


  // ---- 6. NAV HOVER (keyboard-friendly) ----
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => { link.style.letterSpacing = '0.28em'; });
    link.addEventListener('mouseleave', () => { link.style.letterSpacing = '0.2em'; });
  });


  // ---- 7. POLAROID HOVER WOBBLE (respects reduced motion) ----
  if (!prefersReducedMotion) {
    const classRotations = {
      p1: 'rotate(-4deg) translateY(10px)',
      p2: 'rotate(3deg) translateY(-15px)',
      p3: 'rotate(-2deg) translateY(20px)',
      p4: 'rotate(5deg) translateY(-8px)',
      p5: 'rotate(-6deg) translateY(5px)',
      p6: 'rotate(2deg) translateY(12px)',
    };

    polaroids.forEach(p => {
      p.addEventListener('mouseenter', () => {
        const wobble = (Math.random() * 6 - 3).toFixed(1);
        p.style.transform = `rotate(${wobble}deg) scale(1.04)`;
        p.style.zIndex = 20;
      });
      p.addEventListener('mouseleave', () => {
        p.style.zIndex = '';
        if (p.style.position !== 'absolute') {
          for (const [cls, rot] of Object.entries(classRotations)) {
            if (p.classList.contains(cls)) p.style.transform = rot;
          }
        }
      });
    });
  }

  console.log('%c AURA HOUSE', 'font-size:2rem; font-family:serif; color:#d4a017; background:#0a0a0a; padding:10px 20px;');
  console.log('%c put the phone down.', 'font-size:1rem; color:#f0e8d0; background:#0a0a0a; padding:4px 20px;');


  // ---- 8. FALLING GAME PIECES (Parallax Side Decoration) ----
  // Only chess, dice, and card suits. Only visible after the hero collage.
  const prefersReducedMotionPieces = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotionPieces && window.innerWidth >= 900) {

    const pieces = [
      // Chess pieces
      { symbol: '♟', color: '#f0e8d0', glow: '#d4a017' },
      { symbol: '♜', color: '#f0e8d0', glow: '#d4a017' },
      { symbol: '♞', color: '#f0e8d0', glow: '#d4a017' },
      { symbol: '♝', color: '#f0e8d0', glow: '#d4a017' },
      { symbol: '♛', color: '#d4a017', glow: '#9a0000' },
      { symbol: '♚', color: '#d4a017', glow: '#9a0000' },
      // Dice (unicode outline faces)
      { symbol: '⚀', color: '#fafaf5', glow: '#d4a017' },
      { symbol: '⚁', color: '#fafaf5', glow: '#d4a017' },
      { symbol: '⚂', color: '#fafaf5', glow: '#d4a017' },
      { symbol: '⚃', color: '#fafaf5', glow: '#d4a017' },
      { symbol: '⚄', color: '#fafaf5', glow: '#9a0000' },
      { symbol: '⚅', color: '#fafaf5', glow: '#9a0000' },
      // Card suits
      { symbol: '♠', color: '#f0e8d0', glow: '#d4a017' },
      { symbol: '♣', color: '#f0e8d0', glow: '#d4a017' },
      { symbol: '♥', color: '#9a0000', glow: '#d4a017' },
      { symbol: '♦', color: '#9a0000', glow: '#f0e8d0' },
    ];

    // Parallax speed tiers — lower = feels farther/slower
    const parallaxSpeeds = [0.1, 0.18, 0.28, 0.38, 0.5];

    const layer = document.createElement('div');
    layer.id = 'game-pieces-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    // The content column is max ~1100px wide, centered.
    // Pieces should live between the content edge and the screen edge.
    // We compute gutter bounds dynamically on resize.
    function getGutterWidth() {
      const vw = window.innerWidth;
      const contentW = Math.min(1100, vw);
      const gutter = (vw - contentW) / 2; // px from screen edge to content edge
      // Allow pieces to drift up to 80% into the gutter, min 16px from edge
      return {
        min: 16,
        max: Math.max(30, gutter * 0.9),
      };
    }

    const PIECE_COUNT = 32; // 16 per side
    const activePieces = [];

    function randomBetween(a, b) { return a + Math.random() * (b - a); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function createPiece(side) {
      const def = pick(pieces);
      const speed = pick(parallaxSpeeds);
      const duration = randomBetween(9, 24);
      const delay = randomBetween(-22, 0); // negative = already falling on load
      const { min, max } = getGutterWidth();
      const x = randomBetween(min, max);
      const opacity = randomBetween(0.22, 0.58);
      const rotStart = randomBetween(-60, 60);
      const rotEnd = rotStart + randomBetween(-150, 150);
      const fontSize = randomBetween(1.6, 3.0);

      const el = document.createElement('span');
      el.className = `game-piece side-${side}`;
      el.setAttribute('aria-hidden', 'true');
      el.textContent = def.symbol;

      el.style.setProperty('--piece-x', `${x}px`);
      el.style.setProperty('--piece-opacity', opacity);
      el.style.setProperty('--rot-start', `${rotStart}deg`);
      el.style.setProperty('--rot-end', `${rotEnd}deg`);
      el.style.fontSize = `${fontSize}rem`;
      el.style.color = def.color;
      el.style.textShadow = `0 0 10px ${def.glow}99, 0 0 22px ${def.glow}44`;
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;

      layer.appendChild(el);
      activePieces.push({ el, speed });
      return el;
    }

    for (let i = 0; i < PIECE_COUNT / 2; i++) createPiece('left');
    for (let i = 0; i < PIECE_COUNT / 2; i++) createPiece('right');

    // --- Show layer only after hero has scrolled past ---
    const hero = document.querySelector('.collage-section');
    let heroBottom = 0;

    function updateHeroBottom() {
      if (hero) heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
    }
    updateHeroBottom();
    window.addEventListener('resize', updateHeroBottom, { passive: true });

    // --- Parallax on scroll ---
    let rafId = null;

    function applyParallax() {
      const scrollY = window.scrollY;

      // Fade layer in/out based on whether hero is scrolled past
      const pastHero = scrollY > heroBottom - window.innerHeight * 0.5;
      layer.style.opacity = pastHero ? '1' : '0';
      layer.style.transition = 'opacity 0.6s ease';

      // Apply individual parallax offsets
      activePieces.forEach(({ el, speed }) => {
        el.style.marginTop = `${-scrollY * speed * 0.5}px`;
      });

      rafId = null;
    }

    window.addEventListener('scroll', () => {
      if (!rafId) rafId = requestAnimationFrame(applyParallax);
    }, { passive: true });

    // Initial state — hidden until scrolled
    layer.style.opacity = '0';

    // Reposition pieces on resize to respect new gutter bounds
    window.addEventListener('resize', () => {
      if (window.innerWidth < 900) {
        layer.style.display = 'none';
        return;
      }
      layer.style.display = '';
      const { min, max } = getGutterWidth();
      activePieces.forEach(({ el }) => {
        const x = randomBetween(min, max);
        el.style.setProperty('--piece-x', `${x}px`);
      });
    }, { passive: true });
  }

});