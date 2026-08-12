import { ReactNode } from "react";
import { motion } from "framer-motion";
import { chipEntrance, rowEntrance } from "@/lib/motion";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

// An empty state is usually the answer to something the user just did — a
// search that found nothing, a filter with no matches. Cascading it gives that
// answer a beat of its own instead of having it appear as an abrupt swap.
export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-20 text-center">
      {icon && (
        <motion.div {...chipEntrance()} className="mb-6">
          {typeof icon === "string" ? (
            <div className="text-6xl mb-4">{icon}</div>
          ) : (
            <div className="mb-4">{icon}</div>
          )}
        </motion.div>
      )}
      <motion.h3
        {...rowEntrance(1)}
        className="text-2xl font-bold text-foreground mb-3"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p {...rowEntrance(2)} className="text-muted-foreground mb-6">
          {description}
        </motion.p>
      )}
      {action && <motion.div {...rowEntrance(3)}>{action}</motion.div>}
    </div>
  );
};
