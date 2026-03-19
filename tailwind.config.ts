import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rufus: {
          bg: "var(--bg-primary)",
          card: "var(--bg-card)",
          border: "var(--bg-border)",
          purple: "#7C3AED",
          "purple-light": "#a78bfa",
          "purple-dark": "#5b21b6",
          accent: "#a78bfa",
        },
      },
    },
  },
  plugins: [],
}

export default config
