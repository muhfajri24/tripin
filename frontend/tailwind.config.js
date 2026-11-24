/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: '#FF6B5E',
          light: '#FF8A80',
          dark: '#E55A4E',
        },
        yellow: {
          trip: '#FFC857',
          light: '#FFD880',
          dark: '#E0A830',
        },
        teal: {
          DEFAULT: '#176B67',
          light: '#1E8A85',
          dark: '#0F4A47',
          50: '#EAF4F4',
        },
        sky: '#EAF4F4',
        cream: '#FFF9F0',
        charcoal: {
          DEFAULT: '#253238',
          light: '#3D4F57',
          lighter: '#6B7E85',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        'fast': '180ms',
        'normal': '320ms',
        'slow': '600ms',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(37, 50, 56, 0.08)',
        card: '0 8px 30px rgba(37, 50, 56, 0.10)',
        hover: '0 20px 40px rgba(23, 107, 103, 0.15)',
        coral: '0 4px 14px rgba(229, 90, 78, 0.12)',
        teal: '0 8px 24px rgba(23, 107, 103, 0.3)',
      },
      backgroundImage: {
        'gradient-coral': 'linear-gradient(135deg, #FF6B5E, #FFC857)',
        'gradient-teal': 'linear-gradient(135deg, #176B67, #1E8A85)',
        'gradient-hero': 'linear-gradient(135deg, rgba(23,107,103,0.9) 0%, rgba(255,107,94,0.5) 100%)',
      },
    },
  },
  plugins: [],
};

