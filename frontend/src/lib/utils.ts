import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Without this, twMerge doesn't know the "Academic Prestige" type-scale
// classes (text-body-md, text-headline-xl, ...) conflict with core Tailwind
// sizes (text-base, text-sm, ...) — both stay in the merged className, and
// whichever wins by source order is undefined. That let an Input's built-in
// "text-base md:text-sm" silently coexist with an override, so on some
// viewports the effective font-size dropped below 16px — which makes mobile
// Safari zoom the whole viewport on focus (its input-zoom-prevention rule).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-headline-xl",
        "text-headline-lg",
        "text-headline-lg-mobile",
        "text-headline-md",
        "text-body-lg",
        "text-body-md",
        "text-body-sm",
        "text-label-md",
        "text-label-sm",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
