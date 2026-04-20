import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[1rem] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-[#F2FDAD] focus-visible:ring-3 focus-visible:ring-[#F2FDAD]/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[#F2FDAD] bg-[#F2FDAD] text-[#111214] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#e8f58f] hover:border-[#e8f58f]",
        outline:
          "border-white/10 bg-[#1f2025] text-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#F2FDAD] hover:bg-[#F2FDAD] hover:text-[#111214] aria-expanded:border-[#F2FDAD] aria-expanded:bg-[#F2FDAD] aria-expanded:text-[#111214]",
        secondary:
          "border-white/10 bg-[#1f2025] text-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#F2FDAD] hover:bg-[#F2FDAD] hover:text-[#111214] aria-expanded:border-[#F2FDAD] aria-expanded:bg-[#F2FDAD] aria-expanded:text-[#111214]",
        ghost:
          "text-white/72 hover:border-[#F2FDAD]/30 hover:bg-[#F2FDAD]/14 hover:text-[#F2FDAD] aria-expanded:border-[#F2FDAD]/30 aria-expanded:bg-[#F2FDAD]/14 aria-expanded:text-[#F2FDAD]",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-[#F2FDAD] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 rounded-[0.8rem] px-3 text-sm in-data-[slot=button-group]:rounded-[0.8rem] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[0.9rem] px-3.5 text-sm in-data-[slot=button-group]:rounded-[0.9rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10 rounded-[0.9rem]",
        "icon-xs":
          "size-8 rounded-[0.8rem] in-data-[slot=button-group]:rounded-[0.8rem] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[0.9rem] in-data-[slot=button-group]:rounded-[0.9rem]",
        "icon-lg": "size-11 rounded-[1rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
