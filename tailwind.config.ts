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
          bg: "#0f0f23",
          card: "#1a1a2e",
          border: "#2a2a4a",
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
