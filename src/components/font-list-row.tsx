import type { FontEntry } from "@/data/fonts";
import { EditableSpecimenText } from "@/components/editable-specimen-text";
import { getFontPreviewFamilyName } from "@/lib/font-loader";
import { uiTextSmallClass, uiTextTitleClass } from "@/lib/layout";
import { getListSpecimenMetrics } from "@/lib/specimen";

type FontListRowProps = {
  font: FontEntry;
  previewText: string;
  previewSize: number;
  onPreviewTextChange: (value: string) => void;
  onOpenDetails: (font: FontEntry) => void;
};

export function FontListRow({
  font,
  previewText,
  previewSize,
  onPreviewTextChange,
  onOpenDetails,
}: FontListRowProps) {
  const specimen = getListSpecimenMetrics(font, previewText, previewSize);
  const styleLabel =
    font.source.type === "local"
      ? `${font.source.faces.length} ${font.source.faces.length === 1 ? "style" : "styles"}`
      : "Web font";
  const creditLine = [font.designer, font.foundry].filter(Boolean).join(", ");

  return (
    <article className="border-b border-white/10 py-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetails(font)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenDetails(font);
          }
        }}
        className="group block w-full cursor-pointer rounded-[1rem] px-4 py-5 text-left transition hover:bg-[#23252b] focus-visible:bg-[#23252b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587ec9]/55 sm:px-6 sm:py-6"
      >
        <div className="min-w-0">
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${uiTextSmallClass} leading-6 text-white/68`}>
            <h2 className={`${uiTextTitleClass} font-medium tracking-tight text-white`}>
              {font.family}
            </h2>
            <span>{styleLabel}</span>
            <span className="hidden text-white/22 sm:inline">|</span>
            <span className="basis-full text-white/56 sm:basis-auto">{creditLine}</span>
          </div>

          <div className="mt-5 overflow-hidden py-[0.24em]">
            <EditableSpecimenText
              value={previewText}
              displayValue={specimen.text}
              onChange={onPreviewTextChange}
              singleLine
              className="leading-[1.18] text-white/92"
              style={{
                fontFamily: `"${getFontPreviewFamilyName(font)}", var(--font-sans)`,
                fontSize: `clamp(2.4rem, 5.6vw, ${specimen.size}px)`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
