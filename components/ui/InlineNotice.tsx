import type { HTMLAttributes, ReactNode } from "react";

export type NoticeTone = "info" | "warning" | "danger";

export type InlineNoticeProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  tone: NoticeTone;
  title: string;
  children: ReactNode;
};

const toneClasses: Record<NoticeTone, string> = {
  info: "border-l-info text-info",
  warning: "border-l-warning text-warning",
  danger: "border-l-danger text-danger",
};

export default function InlineNotice({ tone, title, children, className = "", ...props }: InlineNoticeProps) {
  return (
    <div
      {...props}
      role={tone === "danger" ? "alert" : "status"}
      className={`border-l-4 border-y border-r border-border bg-surface p-4 ${toneClasses[tone]} ${className}`}
    >
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-sm text-text">{children}</div>
    </div>
  );
}
