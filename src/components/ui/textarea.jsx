import * as React from "react"

import { fieldFocusRing, fieldInnerSurface, fieldRing } from "@/lib/fieldStyles"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div className={fieldRing}>
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-[10px] px-4 py-3 text-base",
          fieldInnerSurface,
          "placeholder:text-muted-foreground",
          fieldFocusRing,
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props} />
    </div>
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
