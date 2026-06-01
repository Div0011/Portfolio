/**
 * perf.js — Global performance optimizations
 * - IntersectionObserver lazy-load image fade-in
 * - Passive scroll listeners
 * - requestAnimationFrame-based scroll handlers
 * - Prefetch on hover for navigation links
 */

(function () {
  'use strict';

  /* ============================================================
     1. LAZY IMAGE FADE-IN via IntersectionObserver
     ============================================================ */
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            // If the native lazy-load hasn't resolved src yet, force it
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            img.classList.add('img-loaded');
            imgObserver.unobserve(img);
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );

    // Observe all lazy images
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      imgObserver.observe(img);
    });

    // Also observe images already in viewport (no lazy attr)
    document.querySelectorAll('img:not([loading="lazy"])').forEach((img) => {
      img.classList.add('img-loaded');
    });
  } else {
    // Fallback: just show all images
    document.querySelectorAll('img').forEach((img) => img.classList.add('img-loaded'));
  }

  /* ============================================================
     2. PREFETCH on hover — near-instant navigation transitions
     ============================================================ */
  const prefetched = new Set();

  function prefetchURL(url) {
    if (!url || prefetched.has(url)) return;
    prefetched.add(url);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);
  }

  // Prefetch all local .html nav links on hover
  document.querySelectorAll('a[href$=".html"]').forEach((anchor) => {
    anchor.addEventListener('mouseenter', () => prefetchURL(anchor.href), {
      passive: true,
      once: true,
    });
  });

  /* ============================================================
     3. PASSIVE SCROLL LISTENERS — prevent scroll jank
     ============================================================ */
  // Override addEventListener to force passive on wheel/touch events
  const _origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, options) {
    if (
      type === 'touchstart' ||
      type === 'touchmove' ||
      type === 'wheel' ||
      type === 'mousewheel'
    ) {
      if (typeof options === 'object') {
        options.passive = true;
      } else {
        options = { passive: true, capture: !!options };
      }
    }
    return _origAddEventListener.call(this, type, fn, options);
  };

  /* ============================================================
     4. RAF-THROTTLED SCROLL for any custom scroll handlers
     ============================================================ */
  let scrollRAF = null;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollRAF) return;
      scrollRAF = requestAnimationFrame(() => {
        scrollRAF = null;
        // Emit a custom event for any page-specific scroll listeners
        window.dispatchEvent(new CustomEvent('raf-scroll'));
      });
    },
    { passive: true }
  );

  /* ============================================================
     5. CASSETTE TRACK — ensure GPU compositing is on
     ============================================================ */
  document.querySelectorAll('.skills-carousel-track, .cl-layout-vhs-small').forEach((el) => {
    el.style.willChange = 'transform';
    el.style.transform = 'translateZ(0)';
  });

  /* ============================================================
     6. VIDEO — ensure autoplay muted for performance
     ============================================================ */
  document.querySelectorAll('video').forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    // Use IntersectionObserver to only play video when visible
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.25 }
      );
      videoObserver.observe(video);
    }
  });

  /* ============================================================
     7. LOGO — ensure SVG renders crisply on all DPR screens
     ============================================================ */
  document.querySelectorAll('img.header-logo-svg').forEach((logo) => {
    logo.setAttribute('width', '48');
    logo.setAttribute('height', '32');
    logo.style.imageRendering = 'crisp-edges';
  });

  /* ============================================================
     8. CINEMATIC MENU HOVER STICKERS & PERMANENT STICKER
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    const menuNav = document.getElementById('menu-nav');
    if (!menuNav) return;

    // Inject CSS for dynamic pop-up stickers and permanent sticker if not already present
    if (!document.getElementById('menu-stickers-style')) {
      const style = document.createElement('style');
      style.id = 'menu-stickers-style';
      style.textContent = `
        /* Hide Webflow's original inline static menu stickers */
        .wrapper-stickers-menu {
          display: none !important;
        }
        .menu-popup-sticker {
          position: fixed;
          pointer-events: none;
          z-index: 9998;
          width: 280px;
          height: 280px;
          object-fit: contain;
          opacity: 0;
          left: 0;
          top: 0;
          transform: translate3d(var(--start-x), 110vh, 0) scale(0.4) rotate(0deg);
          transition: transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1);
          filter: drop-shadow(0px 12px 32px rgba(0,0,0,0.2));
        }
        .menu-popup-sticker.fly-up {
          opacity: 1;
          transform: translate3d(var(--target-x), var(--target-y), 0) scale(1) rotate(var(--target-rot));
        }
        .menu-popup-sticker.fade-out {
          opacity: 0;
          transform: translate3d(var(--target-x), calc(var(--target-y) - 60px), 0) scale(0.3) rotate(var(--target-rot));
          transition: opacity 1.2s ease-in-out, transform 1.2s ease-in-out;
        }
        .menu-permanent-sticker {
          position: absolute;
          right: 8vw;
          top: 50%;
          transform: translateY(-50%) rotate(12deg);
          width: 360px;
          height: 360px;
          object-fit: contain;
          pointer-events: none;
          z-index: 5;
          opacity: 0.95;
          filter: drop-shadow(0px 16px 36px rgba(0,0,0,0.18));
          animation: floatPermanent 4s ease-in-out infinite alternate;
        }
        @keyframes floatPermanent {
          0% { transform: translateY(-50%) rotate(12deg) translateY(0px); }
          100% { transform: translateY(-50%) rotate(16deg) translateY(-15px); }
        }
        @media (max-width: 991px) {
          .menu-permanent-sticker {
            width: 150px;
            height: 150px;
            right: 2vw;
            top: 80%;
            opacity: 0.7;
          }
          .menu-popup-sticker {
            width: 120px;
            height: 120px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // 1. Append the Permanent Sticker (sticker_8.png) if not already added
    if (!menuNav.querySelector('.menu-permanent-sticker')) {
      const permanentImg = document.createElement('img');
      permanentImg.src = 'images/stickers/sticker_8.webp';
      permanentImg.className = 'menu-permanent-sticker';
      permanentImg.alt = 'Decorative Menu Sticker';
      permanentImg.loading = 'lazy';
      const vhsMenu = menuNav.querySelector('.wrapper-vhs-menu') || menuNav;
      vhsMenu.appendChild(permanentImg);
    }

    // 2. Define target stickers for hover mapping
    const optionStickers = {
      'projects.html': 'images/stickers/sticker_11.webp',
      'contact.html': 'images/stickers/sticker_12.webp',
      'skills.html': 'images/stickers/sticker_3.webp',
      'experience.html': 'images/stickers/sticker_5.webp'
    };

    // Pool of other random stickers to choose from
    const randomPool = [
      'images/stickers/sticker_1.webp',
      'images/stickers/sticker_2.webp',
      'images/stickers/sticker_4.webp',
      'images/stickers/sticker_6.webp',
      'images/stickers/sticker_7.webp',
      'images/stickers/sticker_9.webp',
      'images/stickers/sticker_10.webp'
    ];

    const allStickersPool = [
      ...Object.values(optionStickers),
      ...randomPool
    ];

    // 3. Dynamic pop-up on menu hover logic
    const menuItems = menuNav.querySelectorAll('.menu-item');
    menuItems.forEach((menuItem) => {
      menuItem.addEventListener('mouseenter', () => {
        // Decide if we pop up 1 or 2 stickers
        const count = Math.random() > 0.5 ? 2 : 1;
        const hrefAttr = menuItem.getAttribute('href') || '';
        
        let specificSticker = null;
        for (const [key, val] of Object.entries(optionStickers)) {
          if (hrefAttr.includes(key)) {
            specificSticker = val;
            break;
          }
        }

        // Keep track of chosen stickers for this event to avoid repeating
        const chosenSrcs = [];

        for (let i = 0; i < count; i++) {
          let src = '';
          if (i === 0 && specificSticker) {
            src = specificSticker;
          } else {
            // Filter pool to exclude any sticker already chosen in this hover event
            const availablePool = allStickersPool.filter(s => !chosenSrcs.includes(s));
            src = availablePool[Math.floor(Math.random() * availablePool.length)];
          }
          chosenSrcs.push(src);

          // Pick left or right side randomly to avoid overlapping the central text
          const isLeft = Math.random() > 0.5;
          const leftMin = isLeft ? 0.03 : 0.78;
          const leftMax = isLeft ? 0.22 : 0.97;
          const targetPctX = leftMin + Math.random() * (leftMax - leftMin);
          const targetPctY = 0.2 + Math.random() * 0.55; // 20% to 75% height

          const targetX = window.innerWidth * targetPctX;
          const targetY = window.innerHeight * targetPctY;
          // Compensate for the larger sticker width/height (anchor at center)
          const adjustedX = targetX - 140; 
          const adjustedY = targetY - 140;

          const startX = adjustedX + (Math.random() * 60 - 30);
          const rot = Math.random() * 70 - 35; // random rotation -35deg to +35deg

          const img = document.createElement('img');
          img.src = src;
          img.className = 'menu-popup-sticker';
          img.style.setProperty('--start-x', startX + 'px');
          img.style.setProperty('--target-x', adjustedX + 'px');
          img.style.setProperty('--target-y', adjustedY + 'px');
          img.style.setProperty('--target-rot', rot + 'deg');
          
          menuNav.appendChild(img);

          // Trigger reflow to register style variables
          img.offsetWidth;
          img.classList.add('fly-up');

          // Transition out
          setTimeout(() => {
            img.classList.remove('fly-up');
            img.classList.add('fade-out');
          }, 950);

          // Clean up DOM after fade transition completes
          setTimeout(() => {
            img.remove();
          }, 2250);
        }
      }, { passive: true });
    });
  });

})();

