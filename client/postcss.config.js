// ============================================
// KAT SCHOOL CLIENT — PostCSS Configuration
// ============================================
// PostCSS processes CSS files through plugins
// Tailwind generates utility classes
// Autoprefixer adds vendor prefixes for browsers

export default {
  plugins: {
    // ─── Tailwind CSS ────────────────────────
    // Generates all Tailwind utility classes
    // based on tailwind.config.js
    tailwindcss: {},

    // ─── Autoprefixer ────────────────────────
    // Automatically adds vendor prefixes
    // e.g. -webkit-transform, -moz-transition
    // Targets last 2 browser versions
    autoprefixer: {
      overrideBrowserslist: [
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Safari versions',
        'last 2 Edge versions',
        'last 2 Opera versions',
        '> 1%',
        'not dead',
      ],
      grid: true,
    },
  },
};
