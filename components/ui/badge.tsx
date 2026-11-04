import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[5px] border px-[9px] py-[3px] text-[10px]",
  {
    variants: {
      variant: {
        active: "border-[#e3eedf] bg-[#eff7ee] text-[#418255]",
        muted: "border-[#e7e9e5] bg-[#f2f3f1] text-[#7a817d]",
      },
    },
    defaultVariants: { variant: "muted" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
