import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  title: string;
  /** Sits under the title, e.g. "Based on your batch and branch". */
  subtitle?: string;
  /** Right of the header — usually a "View all" link. */
  action?: ReactNode;
  /** Centred strip along the bottom edge, e.g. "Browse directory". */
  footer?: ReactNode;
  className?: string;
  /** Override the body padding when rows need to bleed to the card edge. */
  bodyClassName?: string;
  children: ReactNode;
}

// The shell every dashboard module shares: white card, 16px radius, slate
// hairline, ambient lift, and a divided header/body/footer. Keeping it in one
// place is what makes the three home panels read as one system.
export const PanelCard = ({
  title,
  subtitle,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: PanelCardProps) => (
  <section
    className={cn(
      "flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card",
      className
    )}
  >
    <header className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-headline-md text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-body-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </header>

    <div className={cn("flex-1 px-4 py-3", bodyClassName)}>{children}</div>

    {footer && (
      <div className="border-t border-border px-4 py-2.5 text-center">
        {footer}
      </div>
    )}
  </section>
);

export default PanelCard;
