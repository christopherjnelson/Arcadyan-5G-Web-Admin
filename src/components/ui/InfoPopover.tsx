import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function InfoPopover({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Popover className="relative inline-flex">
      <PopoverButton
        aria-label={`About ${title}`}
        className="text-slate-400 transition-colors hover:text-amber-400 focus:outline-none"
      >
        <Info className="h-4 w-4" />
      </PopoverButton>
      <PopoverPanel
        anchor="bottom start"
        className="z-30 mt-1 w-72 rounded-md border border-slate-600 bg-slate-800 p-3 text-sm text-slate-200 shadow-xl"
      >
        <p className="mb-1 font-semibold text-slate-100">{title}</p>
        {children}
      </PopoverPanel>
    </Popover>
  );
}
