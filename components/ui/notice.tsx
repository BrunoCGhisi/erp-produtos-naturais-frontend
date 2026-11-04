import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const noticeVariants = cva(
  "mb-5 flex gap-3 rounded-lg border px-5 py-[17px] text-[12px]",
  {
    variants: {
      variant: {
        error: "border-[#f0d6d0] bg-[#fff4f1] text-[#963e32]",
        info: "border-[#dce8d5] bg-[#f0f6ec] text-[#577748]",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

export function Notice({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof noticeVariants>) {
  return (
    <div className={cn(noticeVariants({ variant }), className)} {...props} />
  );
}

export function NoticeDescription({
  className,
  ...props
}: ComponentProps<"p">) {
  return <p className={cn("mt-1 mb-3", className)} {...props} />;
}
