/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sometype': ['"Sometype Mono"', 'monospace'],
      },
      colors: {
        brand: {
          blue: '#4285F4',
          green: '#34A853',
        }
      },
      container: {
        center: true,
        padding: '2rem',
        screens: {
          '2xl': '1400px'
        }
      }
    },
  },
  plugins: [require('@tailwindcss/postcss7-compat')],
}

