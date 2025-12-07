"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerInputProps {
  picker: "hours" | "minutes"
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

const TimePickerInput = React.forwardRef<
  HTMLButtonElement,
  TimePickerInputProps
>(({ className, picker, date, setDate }, ref) => {
  const value = date ? date[picker === "hours" ? "getHours" : "getMinutes"]() : 0
  const
    max = picker === "hours" ? 23 : 59

  const onValueChange = (newValue: string) => {
    const newDate = date ? new Date(date) : new Date()
    const numValue = parseInt(newValue, 10)
    if (picker === "hours") {
      newDate.setHours(numValue)
    } else {
      newDate.setMinutes(numValue)
    }
    setDate(newDate)
  }

  return (
    <Select value={value.toString().padStart(2, '0')} onValueChange={onValueChange}>
      <SelectTrigger
        ref={ref}
        className={cn("w-[4.5rem] text-center focus:ring-0", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {[...Array(max + 1).keys()].map((val) => (
          <SelectItem key={val} value={val.toString().padStart(2, '0')}>
            {val.toString().padStart(2, '0')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

TimePickerInput.displayName = "TimePickerInput"

export { TimePickerInput }
