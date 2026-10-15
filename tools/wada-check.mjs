// Vérifie les contrastes WCAG de chaque palette Wada déclarée dans assets/tokens.css.
// Usage : node tools/wada-check.mjs   (code de sortie 1 si une règle échoue)
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/tokens.css', import.meta.url), 'utf8');
const root = {};
for (const [, name, value] of css.matchAll(/--(good|bad):\s*(#[0-9a-f]{6})/gi)) root[name] ??= value;

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, p) => a.map((v, i) => v * p + b[i] * (1 - p));
const lum = rgb => {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// Rôle → [contraste minimal, raison]
const RULES = {
  ink: [7, 'texte courant (AAA)'],
  'ink-2': [4.5, 'texte secondaire'],
  'ink-3': [4.5, 'méta et légendes'],
  'dot-ink': [4.5, "accent en petit texte"],
  dot: [3, 'le point, éléments graphiques'],
  'on-dot': [4.5, 'texte sur bouton principal (--on-dot sur --fill)'],
  bad: [4.5, 'message d’erreur'],
  good: [3, 'indicateur de succès'],
};

let failed = 0;
for (const [, level, body] of css.matchAll(/\[data-wada="(\w+)"\]\s*\{([^}]*)\}/g)) {
  const get = name => (body.match(new RegExp(`--${name}:\\s*([^;]+);`)) || [])[1]?.trim();
  const resolve = v => (v?.startsWith('var(--') ? get(v.slice(6, -1)) ?? root[v.slice(6, -1)] : v);
  const bg = hex(get('bg')), ink = hex(get('ink')), dot = hex(get('dot'));
  const colors = {
    ink,
    'ink-2': mix(ink, bg, 0.854),
    'ink-3': mix(ink, bg, 0.764),
    dot,
    'dot-ink': hex(resolve(get('dot-ink'))),
    bad: hex(resolve(get('bad')) ?? root.bad),
    good: hex(get('good') ?? root.good),
    fill: hex(resolve(get('fill') ?? 'var(--dot)')),
    'on-dot': hex(resolve(get('on-dot') ?? 'var(--bg)')),
  };
  const lines = [];
  for (const [role, [min, why]] of Object.entries(RULES)) {
    const r = role === 'on-dot' ? ratio(colors['on-dot'], colors.fill) : ratio(colors[role], bg);
    const ok = r >= min;
    if (!ok) failed++;
    lines.push(`${ok ? '  ok ' : ' ÉCHEC'} ${role.padEnd(8)} ${r.toFixed(2).padStart(5)} ≥ ${min}  (${why})`);
  }
  console.log(`${level} · Wada № ${get('wada').replace(/"/g, '')}`);
  console.log(lines.join('\n'));
}
console.log(failed ? `\n${failed} règle(s) en échec.` : '\nToutes les palettes passent.');
process.exit(failed ? 1 : 0);
