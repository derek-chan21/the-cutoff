/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm editorial palette — no neon, no AI-startup-cyan
        bg: '#14110d',           // deep warm charcoal (not pure black, slight brown)
        bg2: '#1c1812',
        surface: 'rgba(255,245,225,0.04)',   // warm cream glass
        surface2: 'rgba(255,245,225,0.07)',
        surface3: 'rgba(255,245,225,0.10)',
        ink: '#f0e7d2',          // warm parchment text
        text: '#ebe3d2',
        muted: '#8a7d65',        // warm beige-gray
        muted2: '#a89882',
        // Accents — earthy, magazine-like
        gold: '#c69749',         // primary accent: rich antique gold
        rust: '#c25d3f',         // secondary: burnt orange/rust
        leather: '#c69749',      // alias of gold for backward compat
        stitch: '#c25d3f',       // alias
        cream: '#f0e7d2',
        // Reserved
        warn: '#d89f4e',
        danger: '#c25d3f',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"DM Mono"', 'monospace'],
        body: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(rgba(240,231,210,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(240,231,210,0.025) 1px, transparent 1px)',
      },
      backgroundSize: { 'grid': '60px 60px' },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,245,225,0.05)',
        'glow-gold': '0 0 24px rgba(198,151,73,0.35)',
      },
    },
  },
  plugins: [],
};
