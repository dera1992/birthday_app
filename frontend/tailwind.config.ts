import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
      boxShadow: {
        glow: "0 30px 80px -30px rgba(190, 24, 93, 0.35)",
        panel: "0 20px 60px -32px rgba(15, 23, 42, 0.4)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(190,24,93,0.22), transparent 28%), radial-gradient(circle at top right, rgba(239,68,68,0.18), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,245,245,0.94))",
        "dark-grid":
          "radial-gradient(circle at top left, rgba(251,113,133,0.2), transparent 28%), radial-gradient(circle at top right, rgba(239,68,68,0.18), transparent 24%), linear-gradient(135deg, rgba(2,6,23,0.98), rgba(15,23,42,0.95))"
      },
    },
  },
  plugins: [],
};

export default config;
