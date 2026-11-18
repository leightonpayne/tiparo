import type { FontEntry } from "@/data/fonts";

export function FontSummary({ font }: { font: FontEntry }) {
  const creditLine = [font.designer, font.foundry].filter(Boolean).join(", ");
  return (
    <div className="ui-font-summary">
      <div>
        <h3 className="ui-item-title">{font.family}</h3>
        {creditLine && <p className="ui-description">{creditLine}</p>}
      </div>
      <p className="ui-meta">
        {font.faces.length} {font.faces.length === 1 ? "style" : "styles"}
      </p>
    </div>
  );
}
