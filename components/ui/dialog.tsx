"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "pr-[25px] text-[21px] font-[650] tracking-[-0.5px]",
        className,
      )}
      {...props}
    />
  );
}
export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-[7px] mb-6 text-[12px] text-muted", className)}
      {...props}
    />
  );
}
export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#12251b66] backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[13px] bg-white p-7 shadow-[0_20px_70px_#102a2733] mobile:px-5 mobile:py-6",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute top-[17px] right-[17px] border-0 bg-transparent p-1 text-[#748076]"
          aria-label="Fechar"
        >
          <X size={20} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
