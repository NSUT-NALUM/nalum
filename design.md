---
name: Academic Prestige
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#5b403c'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#8f706b'
  outline-variant: '#e4beb8'
  surface-tint: '#b82014'
  primary: '#6e0000'
  on-primary: '#ffffff'
  primary-container: '#990000'
  on-primary-container: '#ffa092'
  inverse-primary: '#ffb4a8'
  secondary: '#545f72'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f7'
  on-secondary-container: '#586377'
  tertiary: '#293344'
  on-tertiary: '#ffffff'
  tertiary-container: '#404a5c'
  on-tertiary-container: '#afbacf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930000'
  secondary-fixed: '#d8e3fa'
  secondary-fixed-dim: '#bcc7dd'
  on-secondary-fixed: '#111c2c'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d9e3f9'
  tertiary-fixed-dim: '#bdc7dc'
  on-tertiary-fixed: '#121c2c'
  on-tertiary-fixed-variant: '#3d4759'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin: 32px
  max-width: 1440px
---

## Brand & Style

This design system targets an elite alumni network, balancing the gravity of a prestigious educational institution with the modern functionality of a high-end SaaS platform. The personality is authoritative yet welcoming, aiming to evoke a sense of lifelong belonging and professional pride.

The visual style is **Corporate Modern** with a focus on **Tonal Layering**. It prioritizes high information density without clutter, using generous whitespace to separate distinct data modules. The aesthetic avoids trendy gimmicks, opting instead for a timeless, structured layout that communicates reliability and exclusivity.

## Colors

The palette is anchored by a deep crimson, used strategically for primary actions and brand identifiers to maintain an academic tone. The background utilizes a soft off-white to reduce eye strain during long sessions and distinguish the interface from standard "white-label" portals.

- **Primary (#990000):** Used for "Call to Action" buttons, active states, and institutional branding.
- **Secondary / Slate (#4A5568):** Utilized for secondary text, icons, and structural borders.
- **Surface / Background (#F8F9FA):** The base canvas for the entire application.
- **Success/Warning/Error:** Standard semantic colors should be desaturated to align with the professional slate tones of the system.

## Typography

The design system employs **Hanken Grotesk** across all roles to ensure a sharp, contemporary feel that remains highly legible in data-dense environments. 

- **Headlines:** Use tighter letter spacing and heavier weights to create an authoritative hierarchy.
- **Body Text:** Maintains a standard weight with comfortable line heights for reading long-form institutional news or directory bios.
- **Labels:** Used for metadata, table headers, and overlines. Small labels should occasionally use uppercase styling with slight letter spacing to differentiate them from body text.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop, centered within a 1440px container to maintain readability. 

- **Grid:** A 12-column system is used for the dashboard. Cards typically span 4 columns (for stats/news) or 8 columns (for main activity feeds).
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Mobile Adaptivity:** On mobile devices, margins reduce to 16px and the 12-column grid collapses into a single column. All cards become full-width.
- **Information Density:** Use `spacing-md` (16px) for internal card padding to keep data compact but distinct.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and tonal contrast. Since the background is off-white (#F8F9FA), cards use pure white (#FFFFFF) to naturally lift from the surface.

- **Level 0 (Surface):** The #F8F9FA background.
- **Level 1 (Cards):** Pure white background with a subtle, highly diffused shadow: `0 4px 20px rgba(0, 0, 0, 0.04)`.
- **Level 2 (Dropdowns/Modals):** Pure white background with a more pronounced shadow: `0 12px 32px rgba(0, 0, 0, 0.08)`.
- **Borders:** Cards and inputs use a 1px solid border in a light slate tint (#E2E8F0) to define edges without adding visual weight.

## Shapes

The shape language is consistently rounded to soften the formal nature of the academic content.

- **Standard Elements:** Buttons and small inputs use a 0.5rem (8px) radius.
- **Containers:** Dashboard cards and major sections use a 1rem (16px) radius to create a distinct "modular" feel.
- **Interactive States:** Focus states should follow the container's radius with a 2px offset ring.

## Components

### Buttons
- **Primary:** Crimson background with white text. No gradient. High-contrast hover state (darker crimson).
- **Secondary:** White background with a 1px slate border and slate text.
- **Ghost:** No background or border, crimson text, used for less urgent actions like "View All."

### Cards
All dashboard modules reside in white cards with 16px corner radius. Each card should have a standard header section with a `headline-md` title and optional action link.

### Input Fields
Inputs use a light slate border. Upon focus, the border changes to crimson with a subtle crimson outer glow. Labels are positioned above the field in `label-md` style.

### Lists & Tables
Tables should have minimal decoration. Use 1px slate horizontal dividers only. Row hover states should use a very light tint of the primary color (2% opacity) to highlight the active selection.

### Chips & Badges
Used for graduation years or donation tiers. These should have a subtle background (light slate or light crimson) with dark text, utilizing a pill-shaped radius (rounded-xl).