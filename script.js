// Yeena Fisher website — minimal vanilla JS
// Handles the mobile hamburger menu and footer year.

document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('primaryNav');

  if (toggle && nav) {
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

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  initReelPlayers();
});

/* ==========================================================================
   SHOW REELS — click-to-play video facades.
   Videos never autoplay; they load only once the visitor clicks the play
   button (this also keeps the page fast, since nothing is fetched from
   YouTube/Vimeo until requested). Starting a new reel pauses any other
   reel already playing on the page.

   To add a working reel, replace the placeholder value of data-embed on the
   .reel-video element in showreels.html with the reel's real YouTube or
   Vimeo URL (either the normal share URL or an embed URL both work).
   ========================================================================== */
function initReelPlayers() {
  var reelVideos = document.querySelectorAll('.reel-video[data-embed]');
  if (!reelVideos.length) return;

  function toEmbedUrl(url) {
    if (!url) return null;

    // YouTube: https://www.youtube.com/watch?v=ID  or  https://youtu.be/ID
    var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
    if (ytMatch) {
      return 'https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=1&rel=0';
    }

    // Vimeo: https://vimeo.com/ID
    var vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return 'https://player.vimeo.com/video/' + vimeoMatch[1] + '?autoplay=1';
    }

    // Already an embed-style URL or another host: use as-is.
    return url;
  }

  function playReel(container) {
    var rawUrl = container.getAttribute('data-embed');
    if (!rawUrl || rawUrl.indexOf('PLACEHOLDER_') === 0) return; // no real link yet

    // Pause/reset any other reel currently playing.
    reelVideos.forEach(function (other) {
      if (other !== container && other.classList.contains('is-playing')) {
        stopReel(other);
      }
    });

    var embedUrl = toEmbedUrl(rawUrl);
    var iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = container.getAttribute('aria-label') || 'Video';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    iframe.loading = 'lazy';

    container.appendChild(iframe);
    container.classList.add('is-playing');
  }

  function stopReel(container) {
    var iframe = container.querySelector('iframe');
    if (iframe) iframe.remove();
    container.classList.remove('is-playing');
  }

  reelVideos.forEach(function (container) {
    container.addEventListener('click', function () {
      playReel(container);
    });
    container.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playReel(container);
      }
    });
  });
}
