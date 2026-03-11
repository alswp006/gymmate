/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#09090b", elevated: "#111113", card: "#141416", input: "#0c0c0e" },
        border: { DEFAULT: "#1e1e22", hover: "#2e2e34" },
        text: { DEFAULT: "#f0f0f3", secondary: "#a1a1aa", muted: "#63636e" },
        accent: { DEFAULT: "#3b82f6", hover: "#2563eb", soft: "rgba(59, 130, 246, 0.12)" },
        success: { DEFAULT: "#22c55e", soft: "rgba(34, 197, 94, 0.12)" },
        danger: { DEFAULT: "#ef4444", soft: "rgba(239, 68, 68, 0.12)" },
        warning: { DEFAULT: "#f59e0b", soft: "rgba(245, 158, 11, 0.12)" },
      },
    },
  },
  plugins: [],
};
