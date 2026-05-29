import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1D29",
        slate: "#5A6072",
        mute: "#9AA0AE",
        line: "#E8EAEF",
        brand: "#FF6B35",      // FixIt orange
        brandDark: "#E25420",
        blue: "#2D6CDF",
        ok: "#1F9D55",
        okSoft: "#E6F5EC",
        warn: "#C26A00",
        warnSoft: "#FFF3E0",
        danger: "#D64545",
        dangerSoft: "#FDECEC",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
