"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/src/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex min-h-11 items-center gap-1 border border-gray-200 bg-white p-1 text-gray-600 shadow-sm",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      [
        "inline-flex min-h-9 items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-semibold transition",
        "border border-transparent text-gray-600",
        "hover:bg-[#EAF5F0] hover:text-[#0B5A43]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A43] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:border-[#0B5A43]",
        "data-[state=active]:bg-[#0B5A43]",
        "data-[state=active]:text-white",
        "data-[state=active]:shadow-sm",
      ].join(" "),
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      [
        "mt-4",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-[#0B5A43]",
        "focus-visible:ring-offset-2",
      ].join(" "),
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
