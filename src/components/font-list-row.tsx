import type { FontEntry } from "@/data/fonts";
import { FontSummary } from "@/components/font-summary";
import { EditableSpecimenText } from "@/components/editable-specimen-text";
import { getListSpecimenMetrics } from "@/lib/specimen";

type FontListRowProps = {
  font: FontEntry;
  previewText: string;
  onPreviewTextChange: (value: string) => void;
  onOpenDetails: (font: FontEntry) => void;
};

export function FontListRow({
  font,
  previewText,
  onPreviewTextChange,
  onOpenDetails,
}: FontListRowProps) {
  const specimen = getListSpecimenMetrics(font, previewText);

  return (
    <article>
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
        className="ui-font-row"
      >
        <div className="min-w-0">
          <FontSummary font={font} />

          <div className="ui-font-preview">
            <EditableSpecimenText
              value={previewText}
              displayValue={specimen.text}
              onChange={onPreviewTextChange}
              singleLine
              className="leading-[1.18] text-foreground"
              style={{
                fontFamily: `"${font.previewFamily}", var(--font-sans)`,
                fontSize: `clamp(2.4rem, 5.6vw, ${specimen.size}px)`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
