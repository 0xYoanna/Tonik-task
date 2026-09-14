import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* shadcn's class merger. tailwind-merge resolves conflicts, so a
   caller's `px-6` beats a component's default `px-4` instead of
   both landing in the class string and the CSS order deciding. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
