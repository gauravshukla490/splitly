/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F4EC",
        "paper-line": "#E4DFCF",
        ink: "#1C2B24",
        "ink-soft": "#4A5B52",
        moss: "#2F6B4F",
        "moss-dark": "#204A37",
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
    },
  },
  plugins: [],
};