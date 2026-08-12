import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedToggleOption<T>[];
  /** Accessible name for the group, e.g. "Event view". */
  label?: string;
  className?: string;
  /**
   * Background of the track the indicator slides along. Defaults to the
   * surface tone used on page headers; pass e.g. "bg-card" where the toggle
   * already sits on a tinted strip.
   */
  trackClassName?: string;
}

// Pill switch with a filled indicator that slides between segments.
// Segments are equal-width (flex-1) so the indicator can be positioned purely
// from the active index — no measuring, no layout effects.
export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  trackClassName = "bg-surface-container-high",
}: SegmentedToggleProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "relative grid h-11 shrink-0 items-center rounded-full p-1",
        trackClassName,
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full bg-primary shadow-card transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const isActive = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(optionValue)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-label-md transition-colors duration-300 motion-reduce:transition-none",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
