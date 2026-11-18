import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { cn } from "@/lib/utils";

type EditableSpecimenTextProps = {
  value: string;
  displayValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  singleLine?: boolean;
};

export function EditableSpecimenText({
  value,
  displayValue,
  onChange,
  placeholder = "Type to preview",
  className,
  style,
  singleLine = false,
}: EditableSpecimenTextProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [singleLineMask, setSingleLineMask] = useState<CSSProperties>({});
  const [isFocused, setIsFocused] = useState(false);
  const renderedValue = isFocused ? value : displayValue ?? value;

  const updateSingleLineMask = useCallback(() => {
    if (!ref.current || !singleLine) {
      setSingleLineMask({});
      return;
    }

    const textarea = ref.current;
    const maxScrollLeft = Math.max(textarea.scrollWidth - textarea.clientWidth, 0);
    const canScrollLeft = textarea.scrollLeft > 1;
    const canScrollRight = textarea.scrollLeft < maxScrollLeft - 1;
    const fadeWidth = 40;

    let maskImage = "";

    if (canScrollLeft && canScrollRight) {
      maskImage = `linear-gradient(90deg, transparent 0, #000 ${fadeWidth}px, #000 calc(100% - ${fadeWidth}px), transparent 100%)`;
    } else if (canScrollLeft) {
      maskImage = `linear-gradient(90deg, transparent 0, #000 ${fadeWidth}px, #000 100%)`;
    } else if (canScrollRight) {
      maskImage = `linear-gradient(90deg, #000 0, #000 calc(100% - ${fadeWidth}px), transparent 100%)`;
    }

    setSingleLineMask(
      maskImage
        ? {
            maskImage,
            WebkitMaskImage: maskImage,
          }
        : {},
    );
  }, [singleLine]);

  const resizeToContent = useCallback(() => {
    if (!ref.current || singleLine) {
      return;
    }

    ref.current.style.height = "0px";
    ref.current.style.height = `${ref.current.scrollHeight + 2}px`;
  }, [singleLine]);

  const refreshLayout = useCallback(() => {
    if (singleLine) {
      updateSingleLineMask();
    } else {
      resizeToContent();
    }
  }, [singleLine, updateSingleLineMask, resizeToContent]);

  useLayoutEffect(() => {
    refreshLayout();
  }, [
    renderedValue,
    refreshLayout,
    className,
    style?.fontFamily,
    style?.fontSize,
    style?.fontWeight,
    style?.fontStyle,
    style?.fontStretch,
    style?.fontVariationSettings,
    style?.lineHeight,
    style?.letterSpacing,
    style?.maxWidth,
  ]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const textarea = ref.current;
    let frame: number | null = null;
    let disposed = false;
    const scheduleRefresh = () => {
      if (disposed || frame !== null) {
        return;
      }

      frame = requestAnimationFrame(() => {
        frame = null;
        refreshLayout();
      });
    };
    const observer = new ResizeObserver(scheduleRefresh);

    observer.observe(textarea);

    // Font swaps can change wrapping without changing the textarea's fixed box.
    document.fonts.ready.then(scheduleRefresh);
    document.fonts.addEventListener("loadingdone", scheduleRefresh);

    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", scheduleRefresh);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [refreshLayout]);

  return (
    <textarea
      ref={ref}
      value={renderedValue}
      rows={1}
      wrap={singleLine ? "off" : "soft"}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onScroll={singleLine ? updateSingleLineMask : undefined}
      className={cn(
        "block w-full resize-none border-0 bg-transparent p-0 text-inherit outline-none placeholder:text-white/26 focus:outline-none focus:ring-0 cursor-text",
        singleLine
          ? "tiparo-scrollbar-hidden overflow-x-auto overflow-y-hidden whitespace-nowrap overscroll-x-contain"
          : "overflow-hidden",
        className,
      )}
      style={singleLine ? { ...style, ...singleLineMask } : style}
    />
  );
}
