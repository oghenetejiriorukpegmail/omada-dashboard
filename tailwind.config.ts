import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        moby: {
          orange: '#f7a83c',
          'orange-hover': '#e89729',
          navy: '#333c50',
          'navy-dark': '#25363F',
          'light-bg': '#f1f3f6',
        },
      },
    },
  },
  plugins: [],
};
export default config;
