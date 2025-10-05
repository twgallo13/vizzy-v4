import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-between pt-1 items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background p-0 text-foreground shadow hover:bg-accent hover:text-accent-foreground",
        nav_button_previous: "order-first",
        nav_button_next: "order-last",
        table: "w-full border-collapse space-y-1",
        head_row: "grid grid-cols-7",
        head_cell:
          "text-muted-foreground rounded-md text-[0.8rem] font-normal",
        row: "grid grid-cols-7 mt-2",
        cell:
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day:
          "h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_start:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_range_end:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        ...classNames,
      }}
      {...props}
    />
  )
}

export default Calendar