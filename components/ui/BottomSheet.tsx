import type { HTMLAttributes, ReactNode } from "react";

export type BottomSheetProps = Omit<HTMLAttributes<HTMLElement>, "title" | "children"> & {
  title: string;
  children: ReactNode;
};

export default function BottomSheet({ title, children, className = "", ...props }: BottomSheetProps) {
  return (
    <section
      {...props}
      role="region"
      aria-label={title}
      className={`rounded-t-xl border-t border-border bg-surface shadow-xl ${className}`}
    >
      <span aria-hidden="true" className="mx-auto mt-2 block h-1 w-8 rounded-full bg-border-strong" />
      {children}
    </section>
  );
}
