import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-20 text-center">
      {icon && (
        <div className="mb-6">
          {typeof icon === "string" ? (
            <div className="text-6xl mb-4">{icon}</div>
          ) : (
            <div className="mb-4">{icon}</div>
          )}
        </div>
      )}
      <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
