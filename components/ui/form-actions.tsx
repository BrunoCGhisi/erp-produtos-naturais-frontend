import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function FormActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-[25px] flex justify-end gap-2.5 border-t border-border pt-5 mobile:[&>[data-slot=button]]:flex-1",
        className,
      )}
      {...props}
    />
  );
}
