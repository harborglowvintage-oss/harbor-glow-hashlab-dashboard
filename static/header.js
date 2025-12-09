// header.js - check for photorealistic shell texture and enable it if present
(function(){
  function enableShellIfAvailable() {
    const img = new Image();
    img.onload = function() {
      document.querySelectorAll('.header-logo-frame.shell').forEach(function(el){
        el.classList.add('has-shell');
      });
    };
    img.onerror = function() {
      // no-op, texture not present
    };
    // try loading the texture (no cache-busting to allow normal CDN caching)
    img.src = '/static/img/logo-shell.png';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableShellIfAvailable);
  } else {
    enableShellIfAvailable();
  }
})();
