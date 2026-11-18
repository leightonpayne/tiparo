import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn } from "@/lib/utils";

type ButtonSize = "sm" | "icon-sm";

function buttonClasses({
  size = "sm",
  className,
}: {
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "ui-button group/button inline-flex h-(--ui-control-height) shrink-0 cursor-pointer items-center justify-center rounded-none [border-width:var(--ui-rule-width)] border-border bg-background font-sans text-[length:var(--ui-text-sm)] leading-(--ui-leading-sm) font-medium tracking-wide uppercase whitespace-nowrap text-foreground outline-none select-none hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" ? "gap-2 px-4" : "w-(--ui-control-height)",
    className,
  );
}

function Button({
  className,
  size,
  ...props
}: Omit<ButtonPrimitive.Props, "className"> & {
  className?: string;
  size?: ButtonSize;
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonClasses({ size, className })}
      {...props}
    />
  );
}

export { Button, buttonClasses };
