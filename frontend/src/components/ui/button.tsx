import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[3px_3px_8px_rgba(0,0,0,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.25)] hover:shadow-[5px_5px_14px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,0.35)] active:shadow-[1px_1px_3px_rgba(0,0,0,0.15),inset_-1px_-1px_3px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.15)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[3px_3px_8px_rgba(0,0,0,0.12),inset_-2px_-2px_4px_rgba(0,0,0,0.05),inset_2px_2px_4px_rgba(255,255,255,0.6)] hover:shadow-[5px_5px_14px_rgba(0,0,0,0.18),inset_-2px_-2px_4px_rgba(0,0,0,0.05),inset_2px_2px_5px_rgba(255,255,255,0.8)] active:shadow-[1px_1px_3px_rgba(0,0,0,0.08),inset_-1px_-1px_3px_rgba(0,0,0,0.08),inset_1px_1px_3px_rgba(255,255,255,0.4)]",
        destructive:
          "bg-red-600 text-white shadow-[3px_3px_8px_rgba(0,0,0,0.25),inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[5px_5px_14px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,0.3)] active:shadow-[1px_1px_3px_rgba(0,0,0,0.15),inset_-1px_-1px_3px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.1)]",
        outline:
          "bg-background text-foreground border border-transparent shadow-[3px_3px_8px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.03),inset_2px_2px_4px_rgba(255,255,255,0.7)] hover:shadow-[5px_5px_14px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(0,0,0,0.03),inset_2px_2px_5px_rgba(255,255,255,0.9)] active:shadow-[1px_1px_3px_rgba(0,0,0,0.06),inset_-1px_-1px_3px_rgba(0,0,0,0.06),inset_1px_1px_3px_rgba(255,255,255,0.5)]",
        ghost:
          "bg-transparent shadow-none hover:bg-accent/30 hover:shadow-[4px_4px_10px_rgba(0,0,0,0.12),inset_1px_1px_4px_rgba(255,255,255,0.6)] active:shadow-[1px_1px_3px_rgba(0,0,0,0.06),inset_-1px_-1px_2px_rgba(0,0,0,0.05),inset_1px_1px_2px_rgba(255,255,255,0.3)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
