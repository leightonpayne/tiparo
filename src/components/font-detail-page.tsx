import { useEffect, useState } from "react";
import {
  ArrowDownToLineIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
} from "lucide-react";

import type { FontEntry } from "@/data/fonts";
import { previewPresets } from "@/data/fonts";
import { EditableSpecimenText } from "@/components/editable-specimen-text";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ensureFontLoaded,
  getFontPreviewFamilyName,
  getManualStyleFontFamilyName,
} from "@/lib/font-loader";
import {
  brandButtonClass,
  brandMarkImageClass,
  brandMarkWrapClass,
  brandTitleClass,
  pageBodyShellClass,
  pageHeaderShellClass,
  uiTextBodyClass,
  uiTextSmallClass,
  uiTextTitleClass,
} from "@/lib/layout";
import { cn } from "@/lib/utils";
import { getDialogSpecimenMetrics } from "@/lib/specimen";

type FontDetailPageProps = {
  font: FontEntry;
  previewSize: number;
  onBack: () => void;
};

const styleSizeOptions = [8, 12, 14, 20, 24, 32, 40, 64, 96, 120, 184, 280];

function getNearestStyleSize(value: number) {
  return styleSizeOptions.reduce((closest, option) =>
    Math.abs(option - value) < Math.abs(closest - value) ? option : closest,
  );
}

export function FontDetailPage({
  font,
  previewSize,
  onBack,
}: FontDetailPageProps) {
  const [largeText, setLargeText] = useState<string>(previewPresets.large);
  const [mediumText, setMediumText] = useState<string>(previewPresets.medium);
  const [smallText, setSmallText] = useState<string>(previewPresets.small);
  const previewText = largeText;
  const [stylesPreviewSize, setStylesPreviewSize] = useState(
    getNearestStyleSize(Math.round(previewSize * 0.67)),
  );
  const faces = font.source.type === "local" ? font.source.faces : [];

  useEffect(() => {
    ensureFontLoaded(font);
  }, [font]);

  const hasRepository = Boolean(font.upstream?.projectUrl ?? font.links.source);
  const downloadUrl = font.upstream?.downloadUrl ?? font.links.download ?? null;
  const renderLinkedText = (value: string, href?: string) => {
    if (!href || value === "Unavailable") {
      return value;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-start gap-1.5 transition hover:text-[#F2FDAD] focus-visible:text-[#F2FDAD] focus-visible:outline-none"
      >
        <span>{value}</span>
        <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 opacity-72" />
      </a>
    );
  };
  const renderDetailValue = (value: string, href?: string) => {
    return renderLinkedText(value, href);
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
      value: renderDetailValue(font.foundry || "Unavailable", font.foundryUrl),
    },
    {
      label: "License",
      value: renderDetailValue(font.license || "Unavailable", font.licenseUrl),
    },
    ...(font.copyright
      ? [{ label: "Copyright", value: font.copyright }]
      : []),
    {
      label: "Website",
      value: renderDetailValue(font.links.official || "Unavailable", font.links.official),
    },
    ...(hasRepository
      ? [
          {
            label: "Source",
            value: renderDetailValue(font.links.source || "Unavailable", font.links.source),
          },
          { label: "Commit", value: font.upstream?.version || "Unavailable" },
        ]
      : []),
  ];

  return (
    <main className="min-h-screen pb-16 text-white">
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[#111214]/94 backdrop-blur-xl">
        <div className={cn(pageHeaderShellClass, "justify-between gap-4")}>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className={brandButtonClass}
              aria-label="Back to font library"
            >
              <span className={brandMarkWrapClass}>
                <img
                  src={`${import.meta.env.BASE_URL}tiparo.svg`}
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    brandMarkImageClass,
                    "duration-200 group-hover:scale-[0.84] group-hover:opacity-0 group-focus-visible:scale-[0.84] group-focus-visible:opacity-0",
                  )}
                />
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon-sm" }),
                    "absolute inset-0 translate-y-1 scale-[0.94] place-items-center opacity-0 text-[#111214] transition duration-200 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-hover:border-[#F2FDAD] group-hover:bg-[#F2FDAD] group-hover:text-[#111214] group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-focus-visible:border-[#F2FDAD] group-focus-visible:bg-[#F2FDAD] group-focus-visible:text-[#111214]",
                  )}
                >
                  <ChevronLeftIcon className="size-5" />
                </span>
              </span>
              <div>
                <h1 className={brandTitleClass}>Tiparo</h1>
              </div>
            </button>
          </div>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "px-4",
              )}
            >
              <ArrowDownToLineIcon className="size-4" />
              Download
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="px-4 disabled:opacity-45"
              disabled
            >
              <ArrowDownToLineIcon className="size-4" />
              Download
            </Button>
          )}
        </div>
      </header>

      <div className={pageBodyShellClass}>
        <div className="space-y-7">
          <section>
            <div className="min-w-0">
              <div className="flex min-h-11 items-center">
                <div className={`flex items-center gap-3 ${uiTextSmallClass} text-white/68`}>
                  <h2 className={`${uiTextTitleClass} font-medium tracking-tight leading-none text-white`}>
                    {font.family}
                  </h2>
                </div>
              </div>

              <p className={`mt-3 max-w-3xl ${uiTextSmallClass} leading-7 text-white/56`}>
                {faces.length} {faces.length === 1 ? "style" : "styles"}
                {font.designer ? ` | Designed by ${font.designer}` : ""}
              </p>
              {font.specimen?.note ? (
                <p className={`mt-2 max-w-3xl ${uiTextSmallClass} leading-6 text-white/42`}>
                  {font.specimen.note}
                </p>
              ) : null}

              <div className="mt-8 space-y-8">
                {(
                  [
                    { text: largeText, onChange: setLargeText, sizeMultiplier: 1 },
                    { text: mediumText, onChange: setMediumText, sizeMultiplier: 0.55 },
                    { text: smallText, onChange: setSmallText, sizeMultiplier: 0.38 },
                  ] as const
                ).map(({ text, onChange, sizeMultiplier }, i) => {
                  const metrics = getDialogSpecimenMetrics(font, text, previewSize);
                  const size = Math.max(Math.round(metrics.size * sizeMultiplier), 16);
                  return (
                    <div key={i} className="overflow-visible py-[0.2em]">
                      <EditableSpecimenText
                        value={text}
                        displayValue={metrics.text}
                        onChange={onChange}
                        className={
                          metrics.glyphHeavy
                            ? "whitespace-pre-wrap break-words leading-[1.22] text-white"
                            : "whitespace-pre-wrap break-words leading-[1.32] text-white"
                        }
                        style={{
                          fontFamily: `"${getFontPreviewFamilyName(font)}", var(--font-sans)`,
                          fontSize: `min(${size}px, ${Math.round(sizeMultiplier * 9)}vw)`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <dl className="border-y border-white/10">
              {detailsItems.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "py-4 sm:grid sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]",
                    index < detailsItems.length - 1 && "border-b border-white/10",
                  )}
                >
                  <dt className={`${uiTextSmallClass} text-white/50`}>{item.label}</dt>
                  <dd className={`mt-1 break-words ${uiTextSmallClass} font-medium text-white sm:mt-0`}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <div className="space-y-4">
              <h3 className={`${uiTextTitleClass} font-normal tracking-tight text-white`}>
                Styles
              </h3>

              <div className="flex items-center justify-start gap-4">
                <Select
                  value={`${stylesPreviewSize}`}
                  onValueChange={(value) => setStylesPreviewSize(Number(value))}
                >
                  <SelectTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-9 w-[96px] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:!border-[#F2FDAD] hover:!bg-[#F2FDAD] hover:!text-[#111214] data-[popup-open]:!border-[#F2FDAD] data-[popup-open]:!bg-[#F2FDAD] data-[popup-open]:!text-[#111214]",
                    )}
                  >
                    <SelectValue>{stylesPreviewSize}px</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-[#23252b] text-white ring-0">
                    {styleSizeOptions.map((sizeOption) => (
                      <SelectItem key={sizeOption} value={`${sizeOption}`}>
                        {sizeOption}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="w-[min(22rem,calc(100vw-9rem))] shrink-0 px-1">
                  <Slider
                    min={8}
                    max={300}
                    step={1}
                    value={[stylesPreviewSize]}
                    onValueChange={(value) => {
                      const nextValue = Array.isArray(value) ? value[0] : value;
                      setStylesPreviewSize(nextValue ?? 8);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/12">
              {faces.map((face, faceIndex) => (
                <article
                  key={face.id ?? `${face.file ?? face.path}-${faceIndex}`}
                  className="border-b border-white/12 py-4"
                >
                  <p className={`${uiTextBodyClass} font-medium text-white/82`}>
                    {face.name ?? face.id ?? `Style ${faceIndex + 1}`}
                  </p>
                  <div className="mt-4 overflow-hidden">
                    <EditableSpecimenText
                      value={largeText}
                      displayValue={getDialogSpecimenMetrics(font, largeText, previewSize).text}
                      onChange={setLargeText}
                      singleLine
                      className="pt-[0.16em] pb-[0.22em] leading-[1.16] text-white"
                      style={{
                        fontFamily: `"${getManualStyleFontFamilyName(font, faceIndex)}", var(--font-sans)`,
                        fontStyle: face.style ?? "normal",
                        fontWeight: face.weight,
                        fontSize: `min(${stylesPreviewSize}px, calc(100vw - 5rem))`,
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
