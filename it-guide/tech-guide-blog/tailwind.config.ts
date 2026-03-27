import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f0ff',
          purple: '#7000ff',
          green: '#00ff66',
        },
        dark: {
          bg: '#0a0a0a',
          card: 'rgba(20, 20, 20, 0.6)', // Glassmorphism 배경
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // 마크다운 렌더링을 위한 플러그인
  ],
};
export default config;