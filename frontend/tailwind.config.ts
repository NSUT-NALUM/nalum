import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '16px',
				md: '32px',
			},
			screens: {
				'2xl': '1440px'
			}
		},
		extend: {
			fontFamily: {
				// "Academic Prestige" uses Hanken Grotesk across every role.
				sans: ["Hanken Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
				// Retained for the public marketing pages until they are migrated.
				display: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
				serif: ["Lora", "ui-serif", "Georgia", "serif"],
			},
			// Semantic type scale from design.md. Mobile headline pairs with its
			// desktop counterpart: text-headline-lg-mobile md:text-headline-lg
			fontSize: {
				"headline-xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
				"headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" }],
				"headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
				"headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
				"body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
				"body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
				"body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
				"label-md": ["14px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
				"label-sm": ["12px", { lineHeight: "14px", fontWeight: "500" }],
			},
			maxWidth: {
				content: "var(--content-max)",
			},
			spacing: {
				gutter: "var(--gutter)",
				margin: "var(--page-margin)",
			},
			boxShadow: {
				// Level 1: cards. Level 2: dropdowns and modals.
				card: "var(--elevation-1)",
				overlay: "var(--elevation-2)",
			},
			colors: {
				"nsut-maroon": "#C00404",
				"nsut-yellow": "#FFD700",
				"nsut-beige": "#F5F5DC",
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
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
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
				// --- Academic Prestige extended roles ---
				"primary-hover": "hsl(var(--primary-hover))",
				"primary-active": "hsl(var(--primary-active))",
				"primary-subtle": {
					DEFAULT: "hsl(var(--primary-subtle))",
					foreground: "hsl(var(--primary-subtle-foreground))",
				},
				// Structural slate for secondary text, icons and borders.
				// NOT named `slate` — that would shadow Tailwind's built-in scale.
				ink: "hsl(var(--slate))",
				tertiary: {
					DEFAULT: "hsl(var(--tertiary))",
					foreground: "hsl(var(--tertiary-foreground))",
				},
				success: {
					DEFAULT: "hsl(var(--success))",
					foreground: "hsl(var(--success-foreground))",
					subtle: "hsl(var(--success-subtle))",
				},
				warning: {
					DEFAULT: "hsl(var(--warning))",
					foreground: "hsl(var(--warning-foreground))",
					subtle: "hsl(var(--warning-subtle))",
				},
				surface: {
					DEFAULT: "hsl(var(--surface))",
					lowest: "hsl(var(--surface-lowest))",
					low: "hsl(var(--surface-low))",
					container: "hsl(var(--surface-container))",
					"container-high": "hsl(var(--surface-container-high))",
					"container-highest": "hsl(var(--surface-container-highest))",
					inverse: "hsl(var(--inverse-surface))",
					"inverse-foreground": "hsl(var(--inverse-foreground))",
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			// Shape language from design.md: 8px for buttons/inputs, 16px for
			// dashboard cards and major containers, pill for chips.
			// `lg` stays at --radius (0.5rem) so the existing shadcn components
			// keep their current shape; containers opt in via `rounded-card`.
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				card: '1rem',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
	// Optimize for production
	future: {
		hoverOnlyWhenSupported: true,
	},
	// Better purging - remove unused CSS
	safelist: [
		// Only safelist classes that are dynamically generated
		{
			pattern: /^(bg|text|border)-(nsut-maroon|nsut-yellow|nsut-beige)$/,
		},
	],
} satisfies Config;
