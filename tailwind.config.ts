import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Light mode — White + Blue
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#F7F9FC",
          muted: "#EEF2F9",
          border: "#E3E9F3"
        },
        brand: {
          50: "#EEF4FF",
          100: "#DCE8FF",
          200: "#B3CDFF",
          300: "#7FA9FF",
          400: "#4C82F5",
          500: "#2563EB",
          600: "#1D4FC4",
          700: "#173E9B",
          800: "#122F76",
          900: "#0D2257"
        },
        // Dark mode — Dark + Purple
        night: {
          DEFAULT: "#131320",
          soft: "#191928",
          muted: "#20203350",
          border: "#2C2C42"
        },
        violet: {
          50: "#F3EEFF",
          100: "#E4D9FF",
          200: "#C7B3FF",
          300: "#A886FF",
          400: "#8E63F2",
          500: "#7C4DE0",
          600: "#663DC2",
          700: "#502F97",
          800: "#3B2371",
          900: "#281850"
        },
        ink: {
          DEFAULT: "#151521",
          soft: "#4B4B5C"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        xl2: "1.15rem"
      },
      boxShadow: {
        panel: "0 2px 16px -4px rgba(20, 30, 60, 0.08)",
        panelDark: "0 2px 20px -4px rgba(0, 0, 0, 0.45)"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" }
        },
        bubbleInLeft: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        bubbleInRight: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        thinkBounce: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" }
        },
        cursorBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" }
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124,77,224,0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(124,77,224,0)" }
        }
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        blink: "blink 1.2s infinite ease-in-out",
        bubbleInLeft: "bubbleInLeft 0.28s cubic-bezier(0.16,1,0.3,1)",
        bubbleInRight: "bubbleInRight 0.28s cubic-bezier(0.16,1,0.3,1)",
        thinkBounce: "thinkBounce 1.1s infinite ease-in-out both",
        cursorBlink: "cursorBlink 0.9s infinite step-start",
        popIn: "popIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 2s infinite linear",
        pulseGlow: "pulseGlow 1.8s infinite ease-in-out"
      },
      backgroundSize: {
        shimmer: "200% 100%"
      }
    }
  },
  plugins: []
};

export default config;
