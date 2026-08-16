/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e0f5f5',
          100: '#c5eded',
          500: '#0e9594',
          600: '#0e9594',
          700: '#0b7877',
          800: '#14213d',
        },
        sta: {
          indigo: '#14213d',
          'indigo-700': '#1c2e52',
          'indigo-600': '#243668',
          teal: '#0e9594',
          'teal-light': '#e0f5f5',
          amber: '#f4a340',
          'amber-light': '#fef3e2',
          red: '#e1493c',
          'red-light': '#fdedec',
          green: '#3fa672',
          'green-light': '#e8f6ef',
          blue: '#2f80ed',
          'blue-light': '#eaf2fd',
          violet: '#7c5cbf',
          'violet-light': '#f0ebf9',
          bg: '#f6f7fa',
          surface: '#ffffff',
          border: '#e4e7ee',
          text: '#14213d',
          muted: '#6b7280',
          subtle: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      screens: {
        // Align with reference: mobile ≤480, tablet ≤834
        tablet: '481px',
        desktop: '835px',
      },
    },
  },
  plugins: [],
};
