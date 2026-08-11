import type { Transition, Variants } from "framer-motion";

/* ==========================================================================
   Academic Prestige — motion tokens

   The house style is restrained. Nothing travels far, nothing bounces, and
   nothing outlasts the time it takes to read the thing that moved. There are
   only three moves in the whole dashboard:

     1. an entrance   — a short rise plus a fade (12px on blocks, 6px in rows)
     2. an affordance — a 2–3px lift on hover, a small give on press
     3. a pop         — a spring on state that flips, e.g. an upvote

   Anything richer than that reads as a demo rather than a product. Reduced
   motion is handled once, by the `<MotionConfig reducedMotion="user">` in
   DashboardLayout — individual components never need to check it.
   ========================================================================== */

// Decelerating: quick off the mark, settles gently, never overshoots.
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DURATION = {
  fast: 0.18,
  base: 0.3,
  slow: 0.45,
} as const;

export const transition: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT,
};

/** Hover/press feedback, where a fixed curve reads as mechanical. */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

/** Slightly looser — for a value that flips, like a like count. */
export const SPRING_POP: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 18,
};

/**
 * Parent of a stagger group. Children must carry `staggerItem` or `staggerRow`
 * and must NOT set their own `initial`/`animate`, or they opt out of the
 * cascade and animate on their own clock.
 */
export const staggerContainer = (
  stagger = 0.06,
  delayChildren = 0.04
): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Block-level children: cards, panels, feed rows. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

/* --------------------------------------------------------------------------
   Entrance helpers

   These hand back concrete `initial`/`animate` objects instead of variant
   labels, and that is deliberate. Framer only moves a *variant child* when an
   ancestor propagates a label down to it, and almost every list in the
   dashboard mounts after its ancestors have finished animating, because the
   rows arrive from a fetch. A variant child in that position never receives
   the label and sits at its hidden state forever — invisible, but still taking
   up its full height. The mirror image is just as bad: anything under an
   `<AnimatePresence initial={false}>` inherits "skip your entrance" and never
   animates at all.

   Concrete values dodge both. They run on mount wherever the component sits in
   the tree. Reach for `Stagger`/`StaggerItem` only where the container is the
   top of its own motion tree and its children are present on first render —
   DashboardHome is the one place that holds.

   Spread onto a motion component: `<motion.li {...rowEntrance(index)} />`.
   The transition rides inside `animate` so the element's own `transition` prop
   stays free for hover and tap.
   -------------------------------------------------------------------------- */

// Past about eight rows a cascade stops reading as a cascade and starts
// reading as a wait, so the delay flattens out rather than growing forever.
const MAX_STEPS = 8;

const stepped = (index: number, step: number, base: number): Transition => ({
  ...transition,
  delay: base + Math.min(index, MAX_STEPS) * step,
});

/** Blocks: cards, feed rows, anything with its own border. */
export const blockEntrance = (index = 0, step = 0.05, base = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: stepped(index, step, base) },
});

/** Rows inside a card, where a 12px rise is more travel than the row is tall. */
export const rowEntrance = (index = 0, step = 0.06, base = 0.04) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: stepped(index, step, base) },
});

/** Chips and pills, which read better scaling up than rising. */
export const chipEntrance = (index = 0, step = 0.025, base = 0) => ({
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { ...SPRING, delay: base + Math.min(index, 12) * step },
  },
});

/** Paired with the helpers above when the item can also leave a list. */
export const EXIT_ROW = {
  opacity: 0,
  x: 16,
  transition: { duration: DURATION.fast, ease: EASE_OUT },
} as const;

export const EXIT_BLOCK = {
  opacity: 0,
  y: -8,
  transition: { duration: DURATION.fast, ease: EASE_OUT },
} as const;

/** Crossfade for content that swaps in place — tab panels, filtered lists. */
export const switchVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

/** Things that pop into existence: FABs, badges, conditional pills. */
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: SPRING },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

/** The one card affordance, so every hoverable surface lifts by the same amount. */
export const CARD_HOVER = { y: -3 } as const;
export const CARD_TAP = { scale: 0.995 } as const;
