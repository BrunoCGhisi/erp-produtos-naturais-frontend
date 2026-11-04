"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;
export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "mb-[23px] flex gap-[23px] border-b border-border mobile:gap-[18px]",
        className,
      )}
      {...props}
    />
  );
}
export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "flex items-center gap-2 border-0 border-b-2 border-transparent bg-transparent px-[3px] py-[13px] text-[12px] text-[#7b887e] data-[state=active]:border-b-primary data-[state=active]:font-semibold data-[state=active]:text-primary",
        className,
      )}
      {...props}
    />
  );
}
