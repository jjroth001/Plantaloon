/**
 * Generates Plantaloon's app icon, adaptive-icon layers, monochrome (themed) icon, splash
 * image, notification icon and favicon from one drawing: a pot with a round "balloon" leaf.
 *
 *   npm install --no-save @resvg/resvg-js@2.6.2
 *   node scripts/make-icons.js assets/images [--preview]
 *
 * --preview also writes preview.png showing launcher masks and small sizes (don't commit it).
 */
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const GREEN = '#2E6B48';
const LEAF = '#A3DB9C';
const POT = '#F3E9D8';
const POT_SHADE = '#E2D3BA';

/** Centered in a 1024 box, inside Android's adaptive-icon safe circle (radius ~338). */
function art({ leaf, pot, potShade, vein }) {
  return `<g transform="translate(512 525) scale(1.02) translate(-512 -525)">
    <path d="M512 640 C 512 590, 500 545, 512 470" fill="none" stroke="${leaf}" stroke-width="24" stroke-linecap="round"/>
    <path d="M509 560 C 560 520, 610 520, 650 540 C 615 585, 560 595, 509 560 Z" fill="${leaf}"/>
    <path d="M512 474 L 494 452 L 530 452 Z" fill="${leaf}"/>
    <path d="M512 452 C 420 452, 372 380, 372 330 C 372 250, 436 196, 512 196 C 588 196, 652 250, 652 330 C 652 380, 604 452, 512 452 Z" fill="${leaf}"/>
    ${vein ? `<path d="M512 430 C 505 380, 505 300, 520 236" fill="none" stroke="${vein}" stroke-width="14" stroke-linecap="round" opacity="0.55"/>` : ''}
    <rect x="384" y="632" width="256" height="54" rx="20" fill="${pot}"/>
    <path d="M404 686 H 620 L 598 812 Q 595 828 578 828 H 446 Q 429 828 426 812 Z" fill="${potShade}"/>
  </g>`;
}

const colorArt = art({ leaf: LEAF, pot: POT, potShade: POT_SHADE, vein: GREEN });
const whiteArt = art({ leaf: '#FFFFFF', pot: '#FFFFFF', potShade: '#FFFFFF', vein: null });

const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${
    bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''
  }${body}</svg>`;

const files = {
  'icon.png': svg(colorArt, GREEN),
  'android-icon-foreground.png': svg(colorArt),
  'android-icon-background.png': svg('', GREEN),
  'android-icon-monochrome.png': svg(whiteArt),
  'splash-icon.png': svg(colorArt),
};

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const render = (s, width) =>
  new Resvg(s, { fitTo: { mode: 'width', value: width } }).render().asPng();
for (const [name, s] of Object.entries(files))
  fs.writeFileSync(path.join(out, name), render(s, 1024));
fs.writeFileSync(path.join(out, 'favicon.png'), render(files['icon.png'], 48));
// Status-bar icon: white on transparent, the art scaled up to fill the small square.
fs.writeFileSync(
  path.join(out, 'notification-icon.png'),
  render(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="262 150 500 720">${whiteArt}</svg>`,
    96,
  ),
);

if (process.argv.includes('--preview')) {
  const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
    <rect width="1200" height="420" fill="#ECECEC"/><rect x="600" width="600" height="420" fill="#111"/>
    <defs><clipPath id="c"><circle cx="512" cy="512" r="512"/></clipPath>
      <clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath></defs>
    <g transform="translate(40,60) scale(0.29)"><g clip-path="url(#c)"><rect width="1024" height="1024" fill="${GREEN}"/>${colorArt}</g></g>
    <g transform="translate(360,60) scale(0.29)"><g clip-path="url(#r)"><rect width="1024" height="1024" fill="${GREEN}"/>${colorArt}</g></g>
    <g transform="translate(80,360) scale(0.047)"><g clip-path="url(#c)"><rect width="1024" height="1024" fill="${GREEN}"/>${colorArt}</g></g>
    <g transform="translate(680,60) scale(0.29)"><g clip-path="url(#c)"><rect width="1024" height="1024" fill="${GREEN}"/>${colorArt}</g></g>
    <g transform="translate(980,90) scale(0.2)"><rect width="1024" height="1024" fill="#333"/>${whiteArt}</g>
  </svg>`;
  fs.writeFileSync(path.join(out, 'preview.png'), render(preview, 1200));
}
console.log(`wrote icons to ${out}`);
