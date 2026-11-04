import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[7px] border border-transparent font-semibold whitespace-nowrap transition-[background] duration-150",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-[0_2px_3px_#184c2b10] hover:bg-[#205c3a]",
        outline: "border-[#dce4dc] bg-white text-[#49604e] hover:bg-[#f0f5f0]",
        ghost: "bg-transparent text-[#5f7063] hover:bg-[#f0f5f0]",
        destructive: "bg-[#ad3c35] text-white",
      },
      size: {
        default: "min-h-10 px-4 py-[9px] text-[12px]",
        sm: "min-h-8 px-[11px] py-[5px] text-[11px]",
        icon: "min-h-[34px] w-[34px] p-2 text-[12px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
