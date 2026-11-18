import { useState } from "react";
import { ArrowDownToLineIcon, ExternalLinkIcon } from "lucide-react";

import type { FontEntry } from "@/data/fonts";
import { previewPresets } from "@/data/fonts";
import { AppHeader } from "@/components/app-header";
import { EditableSpecimenText } from "@/components/editable-specimen-text";
import { FontMockupGallery } from "@/components/font-mockup-gallery";
import { Button, buttonClasses } from "@/components/ui/button";
import { pageBodyShellClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { getDetailSpecimenMetrics } from "@/lib/specimen";
import { useScrollReveal } from "@/lib/use-scroll-reveal";

type FontDetailPageProps = {
  font: FontEntry;
  onBack: () => void;
};

export function FontDetailPage({ font, onBack }: FontDetailPageProps) {
  const revealRef = useScrollReveal<HTMLDivElement>(font.id);
  const [largeText, setLargeText] = useState<string>(previewPresets.large);
  const [mediumText, setMediumText] = useState<string>(previewPresets.medium);
  const [smallText, setSmallText] = useState<string>(previewPresets.small);
  const downloadUrl = font.links.download;
  const renderLinkedText = (value: string, href?: string) => {
    if (!href || value === "Unavailable") {
      return value;
    }

    return (
      <a href={href} target="_blank" rel="noreferrer" className="ui-text-link">
        <span>{value}</span>
        <ExternalLinkIcon
          className="mt-1 size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </a>
    );
  };
  const renderDesignerValue = () => {
    if (font.designers.length === 0) {
      return "Unavailable";
    }

    return (
      <span>
        {font.designers.map((designer, index) => (
          <span key={`${designer.name}-${index}`}>
            {index > 0 ? ", " : null}
            {renderLinkedText(designer.name, designer.url)}
          </span>
        ))}
      </span>
    );
  };
  const detailsItems = [
    {
      label: font.designers.length > 1 ? "Designers" : "Designer",
      value: renderDesignerValue(),
    },
    {
      label: "Foundry",
      value: renderLinkedText(font.foundry || "Unavailable", font.foundryUrl),
    },
    {
      label: "License",
      value: renderLinkedText(font.license || "Unavailable", font.licenseUrl),
    },
    ...(font.copyright ? [{ label: "Copyright", value: font.copyright }] : []),
    {
      label: "Website",
      value: renderLinkedText(
        font.links.official || "Unavailable",
        font.links.official,
      ),
    },
    ...(font.links.source
      ? [
          {
            label: "Source",
            value: renderLinkedText(font.links.source, font.links.source),
          },
          { label: "Commit", value: font.version || "Unavailable" },
        ]
      : []),
  ];

  return (
    <main className="ui-page">
      <AppHeader onHome={onBack} back>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonClasses({ className: "ui-download" })}
          >
            <ArrowDownToLineIcon
              className="ui-download-icon"
              aria-hidden="true"
            />
            Download
          </a>
        ) : (
          <Button disabled>
            <ArrowDownToLineIcon aria-hidden="true" />
            Download
          </Button>
        )}
      </AppHeader>

      <div className={`${pageBodyShellClass} ui-detail-body`} ref={revealRef}>
        <div className="ui-page-heading" data-reveal>
          <h2 className="ui-page-title">{font.family}</h2>
        </div>
        <div className="ui-section-stack">
          <section className="ui-section" aria-label="Freeform specimens">
            <div className="ui-specimen-grid">
              {(
                [
                  {
                    text: largeText,
                    onChange: setLargeText,
                    sizeMultiplier: 1,
                    minSize: 32,
                    fluidSize: "6vw",
                    measure: "32ch",
                    lineHeight: 1.18,
                  },
                  {
                    text: mediumText,
                    onChange: setMediumText,
                    sizeMultiplier: 0.55,
                    minSize: 20,
                    fluidSize: "2.5vw",
                    measure: "60ch",
                    lineHeight: 1.5,
                  },
                  {
                    text: smallText,
                    onChange: setSmallText,
                    sizeMultiplier: 0.38,
                    minSize: 16,
                    fluidSize: "1.8vw",
                    measure: "70ch",
                    lineHeight: 1.6,
                  },
                ] as const
              ).map(
                (
                  {
                    text,
                    onChange,
                    sizeMultiplier,
                    minSize,
                    fluidSize,
                    measure,
                    lineHeight,
                  },
                  i,
                ) => {
                  const metrics = getDetailSpecimenMetrics(font, text);
                  const size = Math.max(
                    Math.round(metrics.size * sizeMultiplier),
                    minSize,
                  );
                  return (
                    <div
                      key={i}
                      data-reveal
                      style={{ animationDelay: `${90 + i * 90}ms` }}
                      className={cn(
                        "min-w-0 overflow-visible py-[0.2em]",
                        i === 0 && "lg:col-span-2",
                      )}
                    >
                      <EditableSpecimenText
                        value={text}
                        displayValue={metrics.text}
                        onChange={onChange}
                        className="whitespace-pre-wrap break-words text-foreground"
                        style={{
                          fontFamily: `"${font.previewFamily}", var(--font-sans)`,
                          fontSize: `clamp(${minSize}px, ${fluidSize}, ${size}px)`,
                          maxWidth: measure,
                          lineHeight,
                        }}
                      />
                    </div>
                  );
                },
              )}
            </div>
          </section>

          <FontMockupGallery key={font.id} font={font} />

          <section className="ui-section" aria-label="Type information">
            <dl className="ui-metadata ui-body">
              {detailsItems.map((item, index) => (
                <div
                  key={item.label}
                  data-reveal
                  style={{ animationDelay: `${Math.min(index, 4) * 55}ms` }}
                >
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
