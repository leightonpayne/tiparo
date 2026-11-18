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
    "group/button inline-flex shrink-0 items-center justify-center rounded-[0.9rem] border border-white/10 bg-[#1f2025] bg-clip-padding text-sm font-medium whitespace-nowrap text-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all outline-none select-none hover:border-[#F2FDAD] hover:bg-[#F2FDAD] hover:text-[#111214] aria-expanded:border-[#F2FDAD] aria-expanded:bg-[#F2FDAD] aria-expanded:text-[#111214] focus-visible:border-[#F2FDAD] focus-visible:ring-3 focus-visible:ring-[#F2FDAD]/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive/50 aria-invalid:ring-3 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    size === "sm"
      ? "h-9 gap-1.5 px-3.5 [&_svg:not([class*='size-'])]:size-3.5"
      : "size-9",
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
