import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<"div"> {
  value: number;
}

function Progress({ value, className, ...props }: ProgressProps) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <div
      data-slot="progress"
      className={cn("mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-light", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-success transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export { Progress };
