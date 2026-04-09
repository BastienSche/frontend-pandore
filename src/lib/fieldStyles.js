/**
 * Styles partagés champs formulaire (Input, Textarea, Select, selects natifs).
 * Clair : fond slate léger ; sombre : fond zinc + léger relief pour matcher le dégradé.
 */
export const fieldRing =
  "w-full rounded-xl p-[1.5px] bg-gradient-to-r from-cyan-500/80 via-purple-500/70 to-pink-500/75 shadow-[0_2px_16px_rgba(34,211,238,0.22)] dark:from-cyan-400/45 dark:via-purple-500/42 dark:to-pink-500/48 dark:shadow-[0_0_28px_rgba(34,211,238,0.18)]"

/** Fond + texte à l’intérieur de l’anneau (hors file, géré dans input.jsx) */
export const fieldInnerSurface =
  "border-0 bg-slate-50 text-foreground shadow-none dark:bg-zinc-900/95 dark:text-foreground dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:ring-1 dark:ring-white/[0.07]"

export const fieldFocusRing =
  "transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45 focus-visible:ring-offset-0 dark:focus-visible:ring-cyan-400/30"

/** Radix Select utilise :focus sur le trigger, pas focus-visible */
export const fieldFocusRingSelect =
  "transition-shadow focus:outline-none focus:ring-2 focus:ring-cyan-400/45 focus:ring-offset-0 dark:focus:ring-cyan-400/30"
