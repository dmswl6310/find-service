import type { HTMLAttributes } from "react";

export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  value: number;
  max: number;
  label: string;
};

export default function Progress({ value, max, label, className = "", ...props }: ProgressProps) {
  const safeMax = Math.max(max, 1);
  const clampedValue = Math.min(safeMax, Math.max(0, value));
  const percentage = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={max > 0 ? clampedValue : 0}
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div className="h-full rounded-full bg-action" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
