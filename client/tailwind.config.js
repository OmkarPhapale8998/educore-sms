/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#00236f",
        "on-primary": "#ffffff",
        "primary-container": "#1e3a8a",
        "on-primary-container": "#90a8ff",
        "primary-fixed": "#dce1ff",
        "primary-fixed-dim": "#b6c4ff",
        "on-primary-fixed": "#00164e",
        "on-primary-fixed-variant": "#264191",
        
        "secondary": "#006591",
        "on-secondary": "#ffffff",
        "secondary-container": "#39b8fd",
        "on-secondary-container": "#004666",
        "secondary-fixed": "#c9e6ff",
        "secondary-fixed-dim": "#89ceff",
        "on-secondary-fixed": "#001e2f",
        "on-secondary-fixed-variant": "#004c6e",
        
        "tertiary": "#3e2400",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#5c3800",
        "on-tertiary-container": "#ef9900",
        "tertiary-fixed": "#ffddb8",
        "tertiary-fixed-dim": "#ffb95f",
        "on-tertiary-fixed": "#2a1700",
        "on-tertiary-fixed-variant": "#653e00",
        
        "surface": "#f7f9fb",
        "on-surface": "#191c1e",
        "surface-variant": "#e0e3e5",
        "on-surface-variant": "#444651",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-dim": "#d8dadc",
        "surface-bright": "#f7f9fb",
        "surface-tint": "#4059aa",
        
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "inverse-primary": "#b6c4ff",
        
        "background": "#f7f9fb",
        "on-background": "#191c1e",
        
        "outline": "#757682",
        "outline-variant": "#c5c5d3",
        
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "24px",
        "margin_desktop": "40px",
        "margin_mobile": "16px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
