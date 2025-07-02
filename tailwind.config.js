/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: {
          50: '#f0f7f6',
          100: '#dbeeed',
          200: '#b9dddb',
          300: '#8fc4c1',
          400: '#6ba5a2',
          500: '#5A827E', // Main primary color
          600: '#4a6b68',
          700: '#3d5755',
          800: '#334746',
          900: '#2d3c3b',
        },
        secondary: {
          50: '#f2f8f4',
          100: '#e1f0e6',
          200: '#c5e1cf',
          300: '#9ccaab',
          400: '#84AE92', // Main secondary color
          500: '#5d8f6f',
          600: '#477258',
          700: '#3a5c48',
          800: '#30493a',
          900: '#283d30',
        },
        accent: {
          50: '#f7faf2',
          100: '#eef5e2',
          200: '#deebc7',
          300: '#c7dba2',
          400: '#B9D4AA', // Main accent color
          500: '#9bb87a',
          600: '#7a9459',
          700: '#5f7347',
          800: '#4e5c3b',
          900: '#424e33',
        },
        highlight: {
          50: '#FAFFCA', // Main highlight color
          100: '#fdfde6',
          200: '#fbfbc7',
          300: '#f8f89d',
          400: '#f4f46b',
          500: '#eef041',
          600: '#d4d424',
          700: '#a3a31a',
          800: '#85851a',
          900: '#6f6f1c',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
