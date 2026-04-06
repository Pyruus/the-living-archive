import type { Config } from "tailwindcss";

/** Helper: reference a CSS custom property as a Tailwind color */
const v = (name: string) => `var(--color-${name})`;

export default {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: v("primary"),
        "on-primary": v("on-primary"),
        "primary-container": v("primary-container"),
        "on-primary-container": v("on-primary-container"),
        "primary-fixed": v("primary-fixed"),
        "primary-fixed-dim": v("primary-fixed-dim"),
        "on-primary-fixed": v("on-primary-fixed"),
        "on-primary-fixed-variant": v("on-primary-fixed-variant"),

        secondary: v("secondary"),
        "on-secondary": v("on-secondary"),
        "secondary-container": v("secondary-container"),
        "on-secondary-container": v("on-secondary-container"),
        "secondary-fixed": v("secondary-fixed"),
        "secondary-fixed-dim": v("secondary-fixed-dim"),
        "on-secondary-fixed": v("on-secondary-fixed"),
        "on-secondary-fixed-variant": v("on-secondary-fixed-variant"),

        tertiary: v("tertiary"),
        "on-tertiary": v("on-tertiary"),
        "tertiary-container": v("tertiary-container"),
        "on-tertiary-container": v("on-tertiary-container"),
        "tertiary-fixed": v("tertiary-fixed"),
        "tertiary-fixed-dim": v("tertiary-fixed-dim"),
        "on-tertiary-fixed": v("on-tertiary-fixed"),
        "on-tertiary-fixed-variant": v("on-tertiary-fixed-variant"),

        error: v("error"),
        "on-error": v("on-error"),
        "error-container": v("error-container"),
        "on-error-container": v("on-error-container"),

        background: v("background"),
        "on-background": v("on-background"),
        surface: v("surface"),
        "on-surface": v("on-surface"),
        "surface-variant": v("surface-variant"),
        "on-surface-variant": v("on-surface-variant"),
        "surface-bright": v("surface-bright"),
        "surface-dim": v("surface-dim"),
        "surface-container-lowest": v("surface-container-lowest"),
        "surface-container-low": v("surface-container-low"),
        "surface-container": v("surface-container"),
        "surface-container-high": v("surface-container-high"),
        "surface-container-highest": v("surface-container-highest"),
        "surface-tint": v("surface-tint"),

        outline: v("outline"),
        "outline-variant": v("outline-variant"),

        "inverse-surface": v("inverse-surface"),
        "inverse-on-surface": v("inverse-on-surface"),
        "inverse-primary": v("inverse-primary"),
      },

      fontFamily: {
        headline: ['"Public Sans"', "sans-serif"],
        body: ['"Lexend"', "sans-serif"],
        label: ['"Lexend"', "sans-serif"],
      },

      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateX(-50%) translateY(1rem)" },
          "100%": { opacity: "1", transform: "translateX(-50%) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
