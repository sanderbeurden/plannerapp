import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import("tailwindcss").Config} */
const config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        "status-confirmed": "hsl(var(--status-confirmed))",
        "status-confirmed-bg": "hsl(var(--status-confirmed-bg))",
        "status-hold": "hsl(var(--status-hold))",
        "status-hold-bg": "hsl(var(--status-hold-bg))",
        "status-cancelled": "hsl(var(--status-cancelled))",
        "status-cancelled-bg": "hsl(var(--status-cancelled-bg))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Fraunces", "serif"],
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 8, 3, 0.12)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
