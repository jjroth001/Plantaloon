/**
 * Generates Plantaloon's app icon, adaptive-icon layers, monochrome (themed) icon, splash
 * image, notification icon and favicon from one drawing: a ZZ plant in a pot.
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
const LEAF2 = '#86C97F';
const STEM = '#7DBF76';
const POT = '#F3E9D8';
const POT_SHADE = '#E2D3BA';

/** An almond-shaped leaflet from its base (x0,y0) to its tip (x1,y1); `w` = half its width. */
function leaflet(x0, y0, x1, y1, w, fill) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const p = (t, s) =>
    `${(x0 + dx * t - (dy / len) * s).toFixed(1)} ${(y0 + dy * t + (dx / len) * s).toFixed(1)}`;
  const body = `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} C ${p(0.25, w)}, ${p(0.75, w * 0.85)}, ${x1.toFixed(1)} ${y1.toFixed(1)} C ${p(0.75, -w * 0.85)}, ${p(0.25, -w)}, ${x0.toFixed(1)} ${y0.toFixed(1)} Z" fill="${fill}"/>`;
  // ZZ leaves are glossy: a soft highlight along one side (colour art only).
  const shine = `<path d="M${p(0.3, w * 0.38)} Q ${p(0.55, w * 0.5)} ${p(0.78, w * 0.3)}" fill="none" stroke="#FFFFFF" stroke-width="${(w * 0.14).toFixed(1)}" stroke-linecap="round" opacity="0.45"/>`;
  return fill === '#FFFFFF' ? body : body + shine;
}

/** A ZZ stem: a curve from the soil with pairs of leaflets along it and one at the tip. */
function zzStem({ base, ctrl, tip, pairs, size, leaf, stem }) {
  const from = 0.25;
  const angle = (38 * Math.PI) / 180;
  const at = (t) =>
    [0, 1].map((k) => (1 - t) ** 2 * base[k] + 2 * (1 - t) * t * ctrl[k] + t ** 2 * tip[k]);
  const tangent = (t) => {
    const [x, y] = [0, 1].map(
      (k) => 2 * (1 - t) * (ctrl[k] - base[k]) + 2 * t * (tip[k] - ctrl[k]),
    );
    const l = Math.hypot(x, y);
    return [x / l, y / l];
  };
  let out = `<path d="M${base[0]} ${base[1]} Q ${ctrl[0]} ${ctrl[1]} ${tip[0]} ${tip[1]}" fill="none" stroke="${stem}" stroke-width="13" stroke-linecap="round"/>`;
  for (let i = 0; i < pairs; i++) {
    const t = from + ((1 - from) * i) / pairs;
    const [x, y] = at(t);
    const [tx, ty] = tangent(t);
    const s = size * (0.8 + 0.25 * Math.sin((Math.PI * (i + 0.5)) / pairs));
    for (const side of [-1, 1]) {
      const c = Math.cos(angle * side);
      const sn = Math.sin(angle * side);
      out += leaflet(x, y, x + (tx * c - ty * sn) * s, y + (tx * sn + ty * c) * s, s * 0.42, leaf);
    }
  }
  const [tx, ty] = tangent(1);
  return out + leaflet(tip[0], tip[1], tip[0] + tx * size, tip[1] + ty * size, size * 0.38, leaf);
}

/** A ZZ plant in a pot, centred in a 1024 box inside Android's adaptive-icon safe circle. */
function art({ leaf, leaf2, stem, pot, potShade }) {
  return `<g>
    ${zzStem({ base: [488, 640], ctrl: [440, 520], tip: [400, 330], pairs: 3, size: 96, leaf: leaf2, stem })}
    ${zzStem({ base: [536, 640], ctrl: [590, 500], tip: [632, 290], pairs: 3, size: 100, leaf, stem })}
    <rect x="384" y="632" width="256" height="54" rx="20" fill="${pot}"/>
    <path d="M404 686 H 620 L 598 812 Q 595 828 578 828 H 446 Q 429 828 426 812 Z" fill="${potShade}"/>
  </g>`;
}

const colorArt = art({ leaf: LEAF, leaf2: LEAF2, stem: STEM, pot: POT, potShade: POT_SHADE });
const W = '#FFFFFF';
const whiteArt = art({ leaf: W, leaf2: W, stem: W, pot: W, potShade: W });

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
