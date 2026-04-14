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
        navy: {
          DEFAULT: '#0C1030',
          light: '#131a40',
          dark: '#050816',
        },
        teal: {
          DEFAULT: '#10C3B0',
          bright: '#3DE0D2',
          dark: '#0da393',
        },
        aqua: '#3DE0D2',
        pink: {
          DEFAULT: '#E64563',
          dark: '#c13752',
        },
        gold: {
          DEFAULT: '#F4B03A',
          bright: '#F9C863',
        },
        light: {
          DEFAULT: '#F2F4F8',
          muted: '#cbd5e1',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-navy': 'linear-gradient(135deg, #0C1030 0%, #050816 100%)',
        'gradient-teal': 'linear-gradient(135deg, #10C3B0, #3DE0D2)',
        'gradient-gold': 'linear-gradient(135deg, #F4B03A, #F9C863)',
        'gradient-pink': 'linear-gradient(135deg, #E64563, #c13752)',
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(16, 195, 176, 0.3)',
        'glow-gold': '0 0 20px rgba(244, 176, 58, 0.3)',
        'card': '0 10px 30px rgba(0,0,0,0.3)',
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
