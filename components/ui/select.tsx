import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex min-h-10 w-full appearance-none rounded-sm border border-border-2 bg-white px-3 py-2 pr-9 text-sm text-foreground outline-none transition-[border-color,box-shadow]",
          "focus:border-blue-3 focus:shadow-[0_0_0_3px_rgba(59,130,246,.18)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export { Select };
