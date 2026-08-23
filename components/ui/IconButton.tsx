import Button, { type ButtonProps } from "@/components/ui/Button";

export type IconButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: Exclude<NonNullable<ButtonProps["variant"]>, "danger">;
  "aria-label": string;
};

export default function IconButton({ className = "", size = "md", ...props }: IconButtonProps) {
  const sizeClass = size === "sm" ? "h-9 w-9 p-0" : "h-11 w-11 p-0";

  return <Button {...props} size={size} className={`${sizeClass} ${className}`} />;
}
