/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // ── Elitebox spacing contract (design.md §4): the number IS pixels ────
    // px-24 = 24px, gap-16 = 16px, py-96 = 96px. This REPLACES the default
    // rem scale so every agent writes classes exactly as the design docs do.
    spacing: {
      px: '1px',
      0: '0px',
      0.5: '0.5px',
      1: '1px',
      1.5: '1.5px',
      2: '2px',
      2.5: '2.5px',
      3: '3px',
      3.5: '3.5px',
      ...Object.fromEntries(
        [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 52, 56, 64, 72, 80, 88, 96, 112, 120, 128, 144, 160, 176, 192, 200, 208, 224, 240, 256, 288, 320, 380, 384, 420].map((n) => [n, `${n}px`]),
      ),
    },
    extend: {
      colors: {
        // ── Elitebox locked palette (CSS-var driven) ─────────────────────
        navy: "var(--navy)",
        deep: "var(--deep)",
        cyan: "var(--cyan)",
        purple: "var(--purple)",
        highlight: "var(--highlight)",
        silver: "var(--silver)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        error: "var(--error)",
        live: "var(--live)",
        // ── shadcn compatibility layer (remapped in index.css) ───────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        "muted-surface": "hsl(var(--muted-hsl))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background, 240 60% 8%))",
          foreground: "hsl(var(--sidebar-foreground, 252 100% 97%))",
          primary: "hsl(var(--sidebar-primary, 184 100% 56%))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground, 240 69% 5%))",
          accent: "hsl(var(--sidebar-accent, 244 40% 16%))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground, 252 100% 97%))",
          border: "hsl(var(--sidebar-border, 244 30% 22%))",
          ring: "hsl(var(--sidebar-ring, 184 100% 56%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['Sora', 'ui-rounded', '"SF Pro Rounded"', '"Avenir Next"', '"Segoe UI"', 'sans-serif'],
        sans: ['Inter', 'ui-rounded', '"SF Pro Rounded"', '"Avenir Next"', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-xl': ['3.25rem', { lineHeight: '1.05', letterSpacing: '-0.035em', fontWeight: '800' }],
        'display-l': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title': ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-l': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '500' }],
        'micro': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      borderRadius: {
        xl: "16px",
        lg: "12px",
        md: "10px",
        sm: "8px",
        '2xl': "24px",
      },
      boxShadow: {
        // Moonlit glow recipes
        'focus-glow': '0 0 0 2px rgba(124,217,236,.9), 0 0 24px rgba(124,217,236,.45), 0 8px 32px rgba(0,0,0,.5)',
        'aura-purple': '0 0 20px rgba(139,124,232,.30)',
        'btn-glow': '0 4px 20px rgba(220,230,248,.22)',
        'glow-neon': '0 0 18px rgba(124,217,236,.38)',
        'glass-inner': 'inset 0 1px 0 rgba(240,246,255,0.05)',
        'panel': '0 12px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(240,246,255,0.05)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "live-pulse": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "scroll-cue": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "45%": { transform: "scaleY(1)", transformOrigin: "top" },
          "55%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(-8px)" },
          "50%": { transform: "translateY(8px)" },
        },
        "beam-slide": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "live-pulse": "live-pulse 1.2s ease-in-out infinite",
        "scroll-cue": "scroll-cue 1.6s cubic-bezier(0.22,1,0.36,1) infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "beam-slide": "beam-slide 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
