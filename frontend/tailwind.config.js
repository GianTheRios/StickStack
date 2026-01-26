/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome base
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#fafafa',
          tertiary: '#f5f5f5',
        },
        border: {
          DEFAULT: '#e5e5e5',
          strong: '#171717',
        },
        ink: {
          DEFAULT: '#171717',
          secondary: '#525252',
          muted: '#a3a3a3',
        },
        // Sticky notes - vibrant colors
        note: {
          yellow: '#fef08a',
          coral: '#fecaca',
          mint: '#bbf7d0',
          blue: '#bfdbfe',
        },
        // Claude accent
        claude: {
          DEFAULT: '#f97316',
          light: '#fed7aa',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        hand: ['"Caveat"', 'cursive'],
      },
      boxShadow: {
        // Bold 3D offset shadow
        '3d': '4px 4px 0 0 #171717',
        '3d-sm': '3px 3px 0 0 #171717',
        '3d-hover': '5px 5px 0 0 #171717',
        // Sticky note shadows
        'note': '2px 2px 0 0 rgba(23, 23, 23, 0.15)',
        'note-hover': '3px 3px 0 0 rgba(23, 23, 23, 0.2)',
      },
      borderRadius: {
        'card': '16px',
        'note': '2px',
      },
    },
  },
  plugins: [],
};
