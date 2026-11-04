import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-left whitespace-nowrap",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "hover:bg-[#fcfdfb] [&:last-child>td]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-border bg-[#fafcf9] px-[23px] py-3.5 text-[10px] font-semibold tracking-[0.6px] text-[#7f8c80] compact:px-4",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b border-[#edf0ec] px-[23px] py-[17px] text-[12px] text-[#627266] compact:px-4",
        className,
      )}
      {...props}
    />
  );
}
