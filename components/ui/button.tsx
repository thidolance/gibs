import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-[13px] font-semibold tracking-[0.01em] transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-blue text-white shadow-sm hover:bg-blue-2 focus-visible:ring-2 focus-visible:ring-blue-3 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        secondary:
          "bg-blue-light text-blue hover:bg-[#dde1f5] focus-visible:ring-2 focus-visible:ring-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        outline:
          "border border-border-2 bg-surface text-blue hover:border-blue-3 hover:bg-surface-2",
        ghost:
          "bg-transparent text-blue hover:bg-blue-light focus-visible:ring-2 focus-visible:ring-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        destructive:
          "bg-danger text-white hover:bg-red focus-visible:ring-2 focus-visible:ring-danger/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        warning:
          "bg-warning text-white hover:bg-[#924006] focus-visible:ring-2 focus-visible:ring-warning/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "action-edit":
          "bg-blue-light text-blue shadow-xs transition-all hover:scale-110 hover:bg-blue hover:text-white hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-3 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "action-delete":
          "bg-red-light text-red shadow-xs transition-all hover:scale-110 hover:bg-red hover:text-white hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-2/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      },
      size: {
        default: "h-[38px] px-4",
        sm: "h-8 px-2.5 text-xs gap-1 [&_svg]:size-3.5",
        icon: "h-[38px] w-[38px] p-0",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:size-3.5",
        "icon-circle": "h-9 w-9 rounded-full p-0 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
