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
        // One Click Coaching Brand Colors (Dark Mode)
        espresso: {
          DEFAULT: '#2A221C',
          light: '#3A332C',
          dark: '#1A1511',
        },
        terracotta: {
          DEFAULT: '#B5583E',
          bright: '#CC6B4F',
          dark: '#9A4A35',
        },
        clay: {
          DEFAULT: '#C9A687',
          bright: '#D4B89A',
          dark: '#B08A66',
        },
        bone: {
          DEFAULT: '#F4EFE8',
          light: '#FBF8F3',
          dark: '#EAE3D8',
        },
        stone: {
          DEFAULT: '#6E6358',
          light: '#8F847A',
          dark: '#544A41',
        },
        // Legacy color mappings for backwards compatibility
        navy: {
          DEFAULT: '#2A221C', // Maps to espresso
          light: '#3A332C',
          dark: '#1A1511',
        },
        teal: {
          DEFAULT: '#B5583E', // Maps to terracotta
          bright: '#CC6B4F',
          dark: '#9A4A35',
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
        'gradient-espresso': 'linear-gradient(135deg, #2A221C 0%, #1A1511 100%)',
        'gradient-terracotta': 'linear-gradient(135deg, #B5583E, #CC6B4F)',
        'gradient-clay': 'linear-gradient(135deg, #C9A687, #D4B89A)',
        // Legacy gradient mappings
        'gradient-navy': 'linear-gradient(135deg, #2A221C 0%, #1A1511 100%)',
        'gradient-teal': 'linear-gradient(135deg, #B5583E, #CC6B4F)',
        'gradient-gold': 'linear-gradient(135deg, #C9A687, #D4B89A)',
      },
      boxShadow: {
        'glow-terracotta': '0 0 20px rgba(181, 88, 62, 0.3)',
        'glow-clay': '0 0 20px rgba(201, 166, 135, 0.3)',
        'card': '0 10px 30px rgba(26, 21, 17, 0.4)',
        // Legacy shadow mappings
        'glow-teal': '0 0 20px rgba(181, 88, 62, 0.3)',
        'glow-gold': '0 0 20px rgba(201, 166, 135, 0.3)',
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
  plugins: [],
}
