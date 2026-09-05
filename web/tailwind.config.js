/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // One Click Coaching Brand Colors (Light Mode)
        espresso: {
          DEFAULT: '#2A221C',  // Now used for text/dark elements
          light: '#3A332C',
          dark: '#1A1511',
        },
        terracotta: {
          DEFAULT: '#D4633E',  // Brightened slightly for light backgrounds
          bright: '#E87456',
          dark: '#B5583E',
        },
        clay: {
          DEFAULT: '#C9A687',
          bright: '#D4B89A',
          dark: '#B08A66',
        },
        bone: {
          DEFAULT: '#F4EFE8',  // Now used for backgrounds
          light: '#FBF8F3',    // Lightest background
          dark: '#EAE3D8',     // Secondary background
        },
        stone: {
          DEFAULT: '#6E6358',  // Medium text
          light: '#8F847A',    // Muted text
          dark: '#544A41',     // Darker text
        },
        ink: {
          DEFAULT: '#1A1511',  // Primary text
        },
        paper: {
          DEFAULT: '#FBF8F3',  // Card backgrounds
        },
        line: {
          DEFAULT: '#D9D0C2',  // Borders
          dark: '#C6BAA8',     // Darker borders
        },
        aqua: {
          DEFAULT: '#5EEAD4',  // Accent for Sandler
        },
        pink: {
          DEFAULT: '#F472B6',  // Accent
        },
        // Legacy color mappings for backwards compatibility
        navy: {
          DEFAULT: '#2A221C', // Maps to espresso
          light: '#3A332C',
          dark: '#1A1511',
        },
        teal: {
          DEFAULT: '#D4633E', // Maps to terracotta (brightened)
          bright: '#E87456',
          dark: '#B5583E',
        },
        gold: {
          DEFAULT: '#C9A687', // Maps to clay
          bright: '#D4B89A',
        },
        light: {
          DEFAULT: '#F4EFE8', // Maps to bone
          muted: '#8F847A', // Maps to stone-light
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-espresso': 'linear-gradient(135deg, #F4EFE8 0%, #FBF8F3 100%)',
        'gradient-terracotta': 'linear-gradient(135deg, #D4633E, #E87456)',
        'gradient-clay': 'linear-gradient(135deg, #C9A687, #D4B89A)',
        // Legacy gradient mappings
        'gradient-navy': 'linear-gradient(135deg, #F4EFE8 0%, #FBF8F3 100%)',
        'gradient-teal': 'linear-gradient(135deg, #D4633E, #E87456)',
        'gradient-gold': 'linear-gradient(135deg, #C9A687, #D4B89A)',
      },
      boxShadow: {
        'glow-terracotta': '0 0 20px rgba(212, 99, 62, 0.2)',
        'glow-clay': '0 0 20px rgba(201, 166, 135, 0.2)',
        'card': '0 2px 8px rgba(42, 34, 28, 0.08), 0 4px 16px rgba(42, 34, 28, 0.06)',
        // Legacy shadow mappings
        'glow-teal': '0 0 20px rgba(212, 99, 62, 0.2)',
        'glow-gold': '0 0 20px rgba(201, 166, 135, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Hide scrollbar utility
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      })
    },
  ],
}
