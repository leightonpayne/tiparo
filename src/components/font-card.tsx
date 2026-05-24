import type { FontEntry } from "@/data/fonts";
import { EditableSpecimenText } from "@/components/editable-specimen-text";
import { getFontPreviewFamilyName } from "@/lib/font-loader";
import { uiTextBodyClass, uiTextSmallClass } from "@/lib/layout";
import { getGridSpecimenMetrics } from "@/lib/specimen";

type FontCardProps = {
  font: FontEntry;
  previewText: string;
  previewSize: number;
  onPreviewTextChange: (value: string) => void;
  onOpenDetails: (font: FontEntry) => void;
};

export function FontCard({
  font,
  previewText,
  previewSize,
  onPreviewTextChange,
  onOpenDetails,
}: FontCardProps) {
  const specimen = getGridSpecimenMetrics(font, previewText, previewSize);
  const styleLabel =
    font.source.type === "local"
      ? `${font.source.faces.length} ${font.source.faces.length === 1 ? "style" : "styles"}`
      : "Web font";
  const creditLine = [font.designer, font.foundry].filter(Boolean).join(", ");

  return (
    <article
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
      className="flex min-h-[380px] w-full cursor-pointer flex-col rounded-[0.9rem] border border-white/16 bg-[#17181c] px-5 py-5 text-left transition hover:border-white/26 hover:bg-[#1a1b20]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className={`${uiTextBodyClass} font-medium tracking-tight text-white`}>
            {font.family}
          </p>
          <p className={`${uiTextSmallClass} leading-6 text-white/70`}>{creditLine}</p>
        </div>
        <p className={`shrink-0 ${uiTextSmallClass} font-medium text-white/72`}>
          {styleLabel}
        </p>
      </div>

      <div className="mt-6 flex-1 overflow-hidden">
        <EditableSpecimenText
          value={previewText}
          displayValue={specimen.text}
          onChange={onPreviewTextChange}
          className={
            specimen.glyphHeavy
              ? "w-full max-w-full whitespace-pre-wrap break-words pt-[0.14em] pb-[0.2em] leading-[1.28] text-white/92"
              : "w-full max-w-full whitespace-pre-wrap break-words pt-[0.14em] pb-[0.2em] leading-[1.22] text-white/92"
          }
          style={{
            fontFamily: `"${getFontPreviewFamilyName(font)}", var(--font-sans)`,
            fontSize: `${specimen.size}px`,
          }}
        />
      </div>
    </article>
  );
}
