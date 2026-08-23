/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF9F2",
        cream: "#FBF9F2",
        "cream-dark": "#F2EEDF",
        "paper-line": "#DCE8DE",
        ink: "#1C2B24",
        "ink-soft": "#5B6B62",
        moss: "#2F8F5F",
        "moss-dark": "#1F6B45",
        "moss-light": "#E4F5EA",
        sage: "#8FCBA6",
        "sage-light": "#EEF8F1",
        rust: "#B3413E",
        gold: "#B8862E",
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        ledger:
          "repeating-linear-gradient(transparent, transparent 27px, #E4DFCF 28px)",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.5s ease-out both",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};