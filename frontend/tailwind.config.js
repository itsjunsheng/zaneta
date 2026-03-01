/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0f172a",
          800: "#111827",
          700: "#1f2937"
        }
      },
      boxShadow: {
        card: "0 10px 30px -15px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};
