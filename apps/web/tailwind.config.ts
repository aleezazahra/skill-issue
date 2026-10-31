import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#19291F",
        surface: "#1F3025",
        elevated: "#26382B",
        line: "#35463A",
        ink: "#F0EEE8",
        secondary: "#C3C6BE",
        muted: "#929B90",
        green: {
          DEFAULT: "#4CAF50",
          hover: "#5BBC60",
          ink: "#102016",
        },
        focus: "#A4D49A",
        danger: "#E57373",
      },
      fontFamily: {
        sans: ["Nunito Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "1180px",
      },
      borderRadius: {
        panel: "14px",
      },
    },
  },
  plugins: [],
} satisfies Config;
