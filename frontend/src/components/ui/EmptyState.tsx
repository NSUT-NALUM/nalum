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
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-20 text-center">
      {icon && (
        <div className="mb-6">
          {typeof icon === "string" ? (
            <div className="text-6xl mb-4">{icon}</div>
          ) : (
            <div className="mb-4">{icon}</div>
          )}
        </div>
      )}
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      {description && <p className="text-gray-400 mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
