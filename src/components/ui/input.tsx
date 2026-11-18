import type { ComponentProps } from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-(--ui-control-height) w-full min-w-0 rounded-none [border-width:var(--ui-rule-width)] border-input bg-transparent px-3 font-sans text-base leading-(--ui-leading-sm) font-normal text-foreground outline-none placeholder:text-muted-foreground hover:border-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive sm:text-[length:var(--ui-text-sm)] file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
