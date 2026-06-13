import * as React from "react"

import { fieldFocusRing, fieldInnerSurface, fieldRing } from "@/lib/fieldStyles"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const isFile = type === "file"
  return (
    <div className={fieldRing}>
      <input
        type={type}
        className={cn(
          "flex w-full rounded-[10px]",
          fieldInnerSurface,
          "placeholder:text-muted-foreground",
          fieldFocusRing,
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isFile
            ? [
                "h-12 min-h-[3rem] cursor-pointer py-1.5 pl-2.5 pr-2.5 text-sm leading-normal text-muted-foreground dark:text-zinc-400",
                "file:mr-3 file:inline-flex file:h-9 file:shrink-0 file:items-center file:justify-center file:rounded-lg file:border-0",
                "file:bg-gradient-to-r file:from-cyan-500/22 file:to-purple-500/18 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900",
                "file:shadow-sm file:transition-colors hover:file:from-cyan-500/32 hover:file:to-purple-500/26 file:cursor-pointer",
                // sombre : bouton fichier fond zinc + texte clair (évite blanc sur dégradé clair)
                "dark:file:bg-gradient-to-r dark:file:from-zinc-700 dark:file:to-zinc-800 dark:file:text-cyan-50 dark:file:shadow-none",
                "dark:file:ring-1 dark:file:ring-white/15",
                "dark:hover:file:from-zinc-600 dark:hover:file:to-zinc-700",
              ]
            : "h-11 min-h-[2.75rem] px-4 py-2.5 text-base",
          className
        )}
        ref={ref}
        {...props} />
    </div>
  );
})
Input.displayName = "Input"

export { Input }
