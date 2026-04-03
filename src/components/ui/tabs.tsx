"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        // Line variant: no pill background; a bottom border acts as the track
        // for the active-tab underline indicator.
        line: "gap-1 bg-transparent border-b border-border data-[variant=line]:h-auto data-[variant=line]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base layout
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
        "text-sm font-medium transition-all",
        // Default variant sizing (pill tabs)
        "h-[calc(100%-1px)] flex-1 rounded-md border border-transparent px-1.5 py-0.5",
        // Text colour
        "text-muted-foreground hover:text-foreground",
        "dark:text-muted-foreground dark:hover:text-foreground",
        // Focus ring
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        // Vertical tabs
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        // Icon slotting
        "has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1",
        // SVG resets
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // --- Default variant: pill with background on active ---
        "group-data-[variant=default]/tabs-list:data-active:bg-background",
        "group-data-[variant=default]/tabs-list:data-active:text-foreground",
        "group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        "dark:group-data-[variant=default]/tabs-list:data-active:border-input",
        "dark:group-data-[variant=default]/tabs-list:data-active:bg-input/30",

        // --- Line variant: no pill background; underline indicator ---
        // Override height/padding/radius for a taller, more comfortable trigger
        "group-data-[variant=line]/tabs-list:h-auto group-data-[variant=line]/tabs-list:rounded-none",
        "group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent",
        "group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:py-2.5",
        "group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-active:text-foreground",
        "group-data-[variant=line]/tabs-list:data-active:shadow-none",
        "dark:group-data-[variant=line]/tabs-list:data-active:border-transparent",
        "dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",

        // Active underline via ::after — sits flush on the TabsList bottom border
        "after:absolute after:transition-opacity after:duration-150",
        "group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5",
        "group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-[1px] group-data-vertical/tabs:after:w-0.5",
        "after:bg-primary after:opacity-0 after:rounded-full",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
