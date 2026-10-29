/* Small, bundled icon set: works offline and avoids a runtime CDN dependency. */
(() => {
  const paths = {
    search: '<circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 4.5 4.5"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M7 7h10v10"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'sliders-horizontal': '<path d="M3 6h5m4 0h9M3 12h11m4 0h3M3 18h3m4 0h11M8 3v6m6 0v6M6 15v6"/>',
    'book-open': '<path d="M12 5v16M3 4h5a4 4 0 0 1 4 3 4 4 0 0 1 4-3h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z"/>',
    'circle-off': '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    moon: '<path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    'list-checks': '<path d="m3 6 2 2 3-3m-5 9 2 2 3-3M12 7h9m-9 8h9M12 21h9"/>',
    'rotate-ccw': '<path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>'
  };
  window.lucide = { createIcons() {
    document.querySelectorAll('i[data-lucide]').forEach(icon => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.7');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = paths[icon.dataset.lucide] || paths.code;
      icon.replaceWith(svg);
    });
  } };
})();
