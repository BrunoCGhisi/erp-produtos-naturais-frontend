import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  as: Comp = "div",
  ...props
}: ComponentProps<"div"> & { as?: "div" | "section" }) {
  return (
    <Comp
      className={cn(
        "overflow-hidden rounded-[10px] border border-border bg-white",
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border px-6 py-[22px] mobile:p-[17px]",
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-[15px] font-[650]", className)} {...props} />;
}

export function PanelDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-[3px] text-[12px] text-muted", className)}
      {...props}
    />
  );
}
