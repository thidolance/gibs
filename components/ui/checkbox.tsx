import * as React from "react";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-[18px] shrink-0 cursor-pointer rounded-[5px] border-border-2 accent-blue",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-3 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
