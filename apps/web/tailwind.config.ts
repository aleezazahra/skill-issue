import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FBF4FA",
        surface: "#FFF9FC",
        elevated: "#F4EAF4",
        line: "#DCCFE2",
        ink: "#22314A",
        secondary: "#4C5C73",
        muted: "#7B879B",
        green: {
          DEFAULT: "#6DBE63",
          hover: "#7DCC72",
          ink: "#17321B",
          deep: "#3F7D39",
        },
        focus: "#5B8FD6",
        danger: "#C25567",
        sky: "#A9CDEA",
        pink: "#F4B8D8",
        sun: "#F3E6A0",
      },
      fontFamily: {
        display: ["Pixelify Sans", "Nunito Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Nunito Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Space Mono", "JetBrains Mono", "ui-monospace", "monospace"],
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
