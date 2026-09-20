/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f8',
          100: '#d7e0ee',
          200: '#aec0dd',
          300: '#7f9bc7',
          400: '#4d70a3',
          500: '#2c4d80',
          600: '#1d3862',
          700: '#152a4a',
          800: '#101f38',
          900: '#0b1626'
        },
        brick: {
          50: '#fdecec',
          100: '#f9cfcf',
          200: '#f0a3a3',
          300: '#e57676',
          400: '#d94f4f',
          500: '#c3272f',
          600: '#a11d24',
          700: '#7e161c',
          800: '#5c1014',
          900: '#3d0a0d'
        },
        steel: {
          50: '#f5f7f9',
          100: '#e8ecf0',
          200: '#d1d9e0',
          300: '#aab8c4',
          400: '#7f92a3',
          500: '#5e7285',
          600: '#4a5c6d',
          700: '#3a4855',
          800: '#2b3641',
          900: '#1c242c'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,31,56,0.06), 0 4px 12px rgba(16,31,56,0.06)'
      }
    }
  },
  plugins: []
};
