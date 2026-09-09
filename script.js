// Yeena Fisher website — VERSION 5 — shared vanilla JS
// Handles: mobile dropdown nav, footer year, click-to-play video facades
// (Demo Reel / Show Reels / Media interviews), the photo-gallery lightbox
// (Red Carpets & Media / Headshots), and the Contact form submission.

/* ==========================================================================
   PAGE ROUTER — this is now a single-page site. Every tab lives in one
   index.html as a <section class="page">; clicking a nav link (or any link
   with a #hash matching a page id) shows that section and hides the rest,
   with no full page reload. Supports deep links like "#headshots/theatrical"
   to open a page AND scroll to an anchor inside it (used by the homepage
   headshot preview cards).
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  initRouter();
  initMobileNav();
  initFooterYear();
  initHomeDesktopDemoFallback();
  initReelPlayers();
  initLightbox();
  initPdfLightbox();
  initContactForm();
});



/* ==========================================================================
   HOME DEMO REEL — DESKTOP DIRECT-LINK FALLBACK
   YouTube's embedded player can trigger an anti-bot sign-in loop on desktop.
   On desktop/non-mobile browsers only, replace that iframe visually with a
   hard-coded thumbnail link to the normal YouTube watch page. iPhone/mobile
   are deliberately left on the existing working iframe.
   ========================================================================== */
function initHomeDesktopDemoFallback() {
  var container = document.getElementById('homeDemoFallback');
  if (!container) return;

  var ua = navigator.userAgent || '';
  var mobileUA = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
  var coarsePhone = window.matchMedia &&
    window.matchMedia('(pointer: coarse)').matches &&
    Math.min(window.screen.width || 9999, window.screen.height || 9999) < 700;

  // Keep the existing iframe exactly as-is on iPhone and other mobile devices.
  if (mobileUA || coarsePhone) return;

  // Desktop only: hide the iframe and reveal the direct YouTube thumbnail link.
  container.classList.add('desktop-fallback-active');
}

function initRouter() {
  var pages = document.querySelectorAll('.page');
  if (!pages.length) return;

  var validPageIds = Array.prototype.map.call(pages, function (p) {
    return p.id.replace('page-', '');
  });

  function showPage(pageId, anchorId) {
    if (validPageIds.indexOf(pageId) === -1) pageId = 'home';

    pages.forEach(function (p) { p.classList.remove('active'); });
    document.getElementById('page-' + pageId).classList.add('active');

    document.querySelectorAll('.primary-nav a, .logo-mark').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-page') === pageId);
    });

    if (anchorId) {
      var target = document.getElementById(anchorId);
      if (target) {
        // Wait a tick so the section is visible before measuring its position.
        setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 30);
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  function routeFromHash() {
    var hash = location.hash.replace('#', '');
    if (!hash) hash = 'home';
    var parts = hash.split('/');
    showPage(parts[0], parts[1]);
  }

  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();
}

/* ==========================================================================
   MOBILE NAV — "MENU ☰" toggle opens a vertical dropdown directly beneath
   the header banner (not a side drawer), per the FINAL COMPLETE spec.
   ========================================================================== */
function initMobileNav() {
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('primaryNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initFooterYear() {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ==========================================================================
   CLICK-TO-PLAY VIDEO FACADES
   Videos never autoplay; they load only once the visitor clicks the play
   button. Starting a new video pauses any other video already playing
   on the page. Works for the Demo Reel, Show Reels cards, and Media &
   Interviews cards — anything with class "reel-video" and a data-embed
   attribute.

   To add or change a video, edit the data-embed value on the matching
   .reel-video element in the page's HTML. Either a normal YouTube share
   URL or an embed URL works; start-time parameters (start=7, start=9,
   etc.) are preserved automatically.
   ========================================================================== */
function initReelPlayers() {
  var reelVideos = document.querySelectorAll('.reel-video[data-embed]');
  if (!reelVideos.length) return;

  // ------------------------------------------------------------------------
  // POSTER / THUMBNAIL — REPAIR
  // Previously these cards had no background image at all (just CSS
  // background:#000), so every Show Reel and Media card looked like a
  // blank/black box until clicked. Fix: pull each video's own official
  // YouTube thumbnail (img.youtube.com — a public static image, no
  // youtube.com page load and no sign-in required) and show it behind the
  // Play button. This now includes the Home Demo Reel too, so it shows an
  // actual frame of Yeena from that video instead of a generic photo.
  // ------------------------------------------------------------------------
  function extractYouTubeId(url) {
    if (!url) return null;
    var m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/);
    return m ? m[1] : null;
  }

  function applyPoster(container, url) {
    container.style.backgroundImage =
      'linear-gradient(rgba(20,8,32,0.30), rgba(20,8,32,0.55)), url("' + url + '")';
    // The Home page Demo Reel thumbnail (YouTube's hqdefault.jpg, 4:3) sits
    // inside a 16:9 box. "cover" would crop the top/bottom of the frame and
    // risk cutting off Yeena's face; "contain" shows the whole thumbnail
    // untouched, letterboxed on the near-black background instead.
    if (container.classList.contains('demo-reel-video')) {
      container.style.backgroundSize = 'contain';
      container.style.backgroundRepeat = 'no-repeat';
      container.style.backgroundPosition = 'center';
    } else {
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
    }
  }

  // Local, always-available photo of Yeena used only if a video's YouTube
  // thumbnail fails to load (blocked network, deleted/restricted video,
  // etc.) — so a card can never end up showing a plain black box.
  var FALLBACK_POSTER = 'theaterical_1.jpg';

  reelVideos.forEach(function (container) {
    // Optional manual override: <div class="reel-video" data-poster="file.jpg" ...>
    var poster = container.getAttribute('data-poster');
    if (!poster) {
      var id = extractYouTubeId(container.getAttribute('data-embed'));
      if (id) poster = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
    }
    if (!poster) {
      applyPoster(container, FALLBACK_POSTER);
      return;
    }
    // Preload before committing to it as the background — if the YouTube
    // thumbnail 404s or is blocked, fall back to the local photo instead
    // of leaving the card blank.
    var probe = new Image();
    probe.onload = function () { applyPoster(container, poster); };
    probe.onerror = function () { applyPoster(container, FALLBACK_POSTER); };
    probe.src = poster;
  });

  function toEmbedUrl(url) {
    if (!url) return null;

    // Already a youtube.com or youtube-nocookie.com /embed/ URL (may include
    // ?start=N) — use as-is.
    if (/youtube(?:-nocookie)?\.com\/embed\//.test(url)) return url;

    // YouTube watch URL, possibly with &t=7s / &t=9s start-time params.
    // Converted to the standard youtube.com/embed/VIDEO_ID form — never a
    // raw watch?v= URL inside the iframe.
    var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
    if (ytMatch) {
      var id = ytMatch[1];
      var embed = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      var tMatch = url.match(/[?&]t=(\d+)s?/);
      if (tMatch) embed += '&start=' + tMatch[1];
      return embed;
    }

    // Vimeo
    var vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return 'https://player.vimeo.com/video/' + vimeoMatch[1] + '?autoplay=1';
    }

    return url;
  }

  function playReel(container) {
    var rawUrl = container.getAttribute('data-embed');
    if (!rawUrl || rawUrl.indexOf('PLACEHOLDER_') === 0) return;

    reelVideos.forEach(function (other) {
      if (other !== container && other.classList.contains('is-playing')) {
        stopReel(other);
      }
    });

    var embedUrl = toEmbedUrl(rawUrl);
    // If the embed URL already has query params, add autoplay with '&', else '?'.
    if (embedUrl.indexOf('autoplay=1') === -1) {
      embedUrl += (embedUrl.indexOf('?') === -1 ? '?' : '&') + 'autoplay=1';
    }
    if (embedUrl.indexOf('rel=0') === -1) {
      embedUrl += (embedUrl.indexOf('?') === -1 ? '?' : '&') + 'rel=0';
    }
    if (embedUrl.indexOf('playsinline=1') === -1) {
      embedUrl += (embedUrl.indexOf('?') === -1 ? '?' : '&') + 'playsinline=1';
    }

    var iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = container.getAttribute('aria-label') || 'Video';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.loading = 'lazy';

    container.appendChild(iframe);
    container.classList.add('is-playing');

    // Explicit close button — lets a visitor stop the video and return to
    // its poster/thumbnail without needing to play a different video first.
    var closeBtn = container.querySelector('.reel-close');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'reel-close';
      closeBtn.setAttribute('aria-label', 'Close video');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        stopReel(container);
      });
      container.appendChild(closeBtn);
    }
  }

  function stopReel(container) {
    var iframe = container.querySelector('iframe');
    if (iframe) iframe.remove();
    var closeBtn = container.querySelector('.reel-close');
    if (closeBtn) closeBtn.remove();
    container.classList.remove('is-playing');
  }

  reelVideos.forEach(function (container) {
    container.addEventListener('click', function () { playReel(container); });
    container.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playReel(container);
      }
    });
  });
}

/* ==========================================================================
   PHOTO GALLERY LIGHTBOX
   Used by the Red Carpets & Media gallery and the Headshots page. Any
   <button> inside a ".photo-grid" wrapping an <img> becomes clickable;
   clicking opens a full-size lightbox with close / prev / next, keyboard
   arrow + Escape support, and click-outside-to-close. Background page
   scroll is locked while open.
   ========================================================================== */
function initLightbox() {
  var grids = document.querySelectorAll('.photo-grid');
  if (!grids.length) return;

  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  var lightboxImg = lightbox.querySelector('img');
  var closeBtn = lightbox.querySelector('.lightbox-close');
  var prevBtn = lightbox.querySelector('.lightbox-prev');
  var nextBtn = lightbox.querySelector('.lightbox-next');

  // Each .photo-grid (Theatrical, Commercial, Red Carpet, etc.) is its own
  // gallery — prev/next stays within the grid the visitor opened, rather
  // than wandering into a different gallery elsewhere on the page.
  var currentItems = [];
  var currentIndex = -1;

  function openAt(items, index) {
    if (index < 0 || index >= items.length) return;
    currentItems = items;
    currentIndex = index;
    var img = currentItems[currentIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if (currentIndex >= 0 && currentItems[currentIndex]) currentItems[currentIndex].focus();
    currentIndex = -1;
  }

  function showNext() { openAt(currentItems, (currentIndex + 1) % currentItems.length); }
  function showPrev() { openAt(currentItems, (currentIndex - 1 + currentItems.length) % currentItems.length); }

  grids.forEach(function (grid) {
    var items = Array.prototype.slice.call(grid.querySelectorAll('button'));
    items.forEach(function (btn, index) {
      btn.addEventListener('click', function () { openAt(items, index); });
    });
  });

  closeBtn.addEventListener('click', close);
  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });
}

/* ==========================================================================
   PDF FULL-SCREEN VIEWER (Bio / Resume "View Full Screen")
   Opens the PDF in an in-page overlay instead of a new browser tab, with an
   explicit close (X) button, Escape-key support, and click-outside-to-close
   — so a visitor always has an obvious way back to the Bio/Resume page
   underneath, without needing to close or switch browser tabs themselves.
   ========================================================================== */
function initPdfLightbox() {
  var triggers = document.querySelectorAll('.pdf-action[data-pdf]');
  if (!triggers.length) return;

  var pdfLightbox = document.getElementById('pdfLightbox');
  if (!pdfLightbox) return;

  var frame = document.getElementById('pdfLightboxFrame');
  var closeBtn = pdfLightbox.querySelector('.pdf-lightbox-close');
  var lastTrigger = null;

  function open(trigger) {
    lastTrigger = trigger;
    frame.src = trigger.getAttribute('data-pdf');
    frame.title = trigger.getAttribute('data-pdf-title') || 'PDF preview';
    pdfLightbox.classList.add('open');
    pdfLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    pdfLightbox.classList.remove('open');
    pdfLightbox.setAttribute('aria-hidden', 'true');
    frame.src = ''; // stop loading/playing the PDF once closed
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () { open(trigger); });
  });

  closeBtn.addEventListener('click', close);

  pdfLightbox.addEventListener('click', function (e) {
    if (e.target === pdfLightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!pdfLightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
  });
}

/* ==========================================================================
   CONTACT FORM
   Submits via fetch to a Formspree endpoint (or any compatible static-site
   form service) so no email credentials ever live in this file. Replace
   FORMSPREE_ENDPOINT in contact.html with the real endpoint URL.
   ========================================================================== */
function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');
  var submitBtn = form.querySelector('.submit-button');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot anti-spam check — if filled, silently drop the submission.
    var honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var endpoint = form.getAttribute('action');
    if (!endpoint || endpoint.indexOf('FORMSPREE_ENDPOINT') !== -1) {
      statusEl.textContent = 'Form is not connected yet — add your Formspree endpoint in contact.html.';
      statusEl.className = 'form-status error';
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (response) {
      if (response.ok) {
        statusEl.textContent = 'Thank you. Your message has been sent successfully.';
        statusEl.className = 'form-status success';
        form.reset();
      } else {
        statusEl.textContent = 'Your message could not be sent. Please try again.';
        statusEl.className = 'form-status error';
      }
    }).catch(function () {
      statusEl.textContent = 'Your message could not be sent. Please try again.';
      statusEl.className = 'form-status error';
    }).finally(function () {
      submitBtn.disabled = false;
    });
  });
}
