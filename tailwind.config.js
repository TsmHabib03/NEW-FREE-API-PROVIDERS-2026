/** Tailwind build config — compiled output is committed; runtime stays zero-build.
    Preflight disabled: css/style.css owns the base layer for the provider list
    components that the shell reuses. Colors resolve through the CSS variables in
    :root (dark, default) and :root[data-theme="light"] (css/theme.css). */
module.exports = {
  content: ['./index.html', './setup.html', './js/**/*.js'],
  darkMode: ['class', '[data-theme="dark"]'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        ink: 'var(--ink)',
        inkdim: 'var(--ink-dim)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        linestrong: 'var(--line-strong)',
        accent: 'var(--accent)',
        accentink: 'var(--accent-ink)',
        violet: 'var(--violet)',
        green: 'var(--green)',
        amber: 'var(--amber)',
        red: 'var(--red)'
      },
      fontFamily: {
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
