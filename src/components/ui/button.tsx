import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "default" &&
          "bg-foreground text-background hover:opacity-90",
        variant === "outline" &&
          "border border-foreground/20 bg-transparent hover:bg-foreground/5",
        className
      )}
      {...props}
    />
  );
}
