import { motion, type HTMLMotionProps } from "framer-motion";
import { staggerContainer, staggerItem, transition } from "@/lib/motion";

/**
 * Wrappers for the two cases a plain `<div>` can carry.
 *
 * `Stagger`/`StaggerItem` rely on framer propagating a variant label down the
 * tree, which only holds when the container sits at the top of its own motion
 * tree and its children exist on first render. Anywhere else — and that is most
 * places, because the lists here fill in from a fetch — use the entrance
 * helpers in `@/lib/motion` on each item instead.
 */

interface StaggerProps extends HTMLMotionProps<"div"> {
  /** Gap between each child's entrance. */
  stagger?: number;
  /** Delay before the first child moves — use to offset a second column. */
  delayChildren?: number;
}

/** Cascades its direct `StaggerItem` children into view. */
export const Stagger = ({
  stagger,
  delayChildren,
  children,
  ...props
}: StaggerProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={staggerContainer(stagger, delayChildren)}
    {...props}
  >
    {children}
  </motion.div>
);

/** A single step in a `Stagger`. Deliberately has no `initial`/`animate`. */
export const StaggerItem = ({ children, ...props }: HTMLMotionProps<"div">) => (
  <motion.div variants={staggerItem} {...props}>
    {children}
  </motion.div>
);

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
}

/** A standalone entrance for something with no siblings to cascade with. */
export const FadeIn = ({ delay = 0, children, ...props }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...transition, delay }}
    {...props}
  >
    {children}
  </motion.div>
);
