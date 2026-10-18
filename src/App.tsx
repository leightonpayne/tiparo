import { useDeferredValue, useEffect, useState, useTransition } from "react";
import {
  LayoutGridIcon,
  Rows3Icon,
  SearchIcon,
} from "lucide-react";

import { FontCard } from "@/components/font-card";
import { FontDetailPage } from "@/components/font-detail-page";
import { FontListRow } from "@/components/font-list-row";
import { Input } from "@/components/ui/input";
import { fontLibrary } from "@/data/font-library";
import { previewPresets, type FontEntry } from "@/data/fonts";
import { ensureFontPreviewsLoaded } from "@/lib/font-loader";
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

type ViewMode = "list" | "grid";

function getRoutePathFromHash(hash: string) {
  const normalizedHash = hash.replace(/^#/, "");
  return normalizedHash.startsWith("/") ? normalizedHash : normalizedHash ? `/${normalizedHash}` : "/";
}

function matchesSearch(font: FontEntry, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    font.family,
    font.designer,
    font.foundry,
    font.license,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function getFontIdFromPath(pathname: string) {
  const match = pathname.match(/^\/fonts\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewText, setPreviewText] = useState<string>(previewPresets.large);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [routePath, setRoutePath] = useState(() => getRoutePathFromHash(window.location.hash));

  const deferredSearch = useDeferredValue(searchQuery);
  const previewSize = 52;
  const availableFonts = fontLibrary;

  useEffect(() => {
    const handleHashChange = () => setRoutePath(getRoutePathFromHash(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const visibleFonts = availableFonts.filter((font) =>
    matchesSearch(font, deferredSearch),
  );
  const activeFontId = getFontIdFromPath(routePath);
  const activeFont =
    activeFontId === null
      ? null
      : availableFonts.find((font) => font.id === activeFontId) ?? null;

  useEffect(() => {
    if (activeFont) {
      return;
    }

    ensureFontPreviewsLoaded(visibleFonts);
  }, [activeFont, visibleFonts]);

  const navigateToFont = (font: FontEntry) => {
    const nextPath = `#/fonts/${encodeURIComponent(font.id)}`;
    window.location.hash = nextPath;
    setRoutePath(getRoutePathFromHash(nextPath));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const navigateHome = () => {
    window.location.hash = "/";
    setRoutePath("/");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  if (activeFont) {
    return (
      <FontDetailPage
        font={activeFont}
        previewSize={previewSize}
        onBack={navigateHome}
      />
    );
  }

  return (
    <main className="min-h-screen pb-16 text-white">
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[#111214]/94 backdrop-blur-xl">
        <div className={pageHeaderShellClass}>
          <div className="flex w-full items-center gap-3 sm:gap-6">
            <div className="shrink-0">
              <button
                type="button"
                onClick={navigateHome}
                className={brandButtonClass}
              >
                <span className={brandMarkWrapClass}>
                  <img
                    src={`${import.meta.env.BASE_URL}tiparo.svg`}
                    alt="Tiparo"
                    className={brandMarkImageClass}
                  />
                </span>
                <div className="hidden sm:block">
                  {/* <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/38">
                    Private library
                  </p> */}
                  <h1 className={brandTitleClass}>Tiparo</h1>
                </div>
              </button>
            </div>

            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-[1.05rem] -translate-y-1/2 text-white/45" />
              <Input
                value={searchQuery}
                onChange={(event) =>
                  startTransition(() => setSearchQuery(event.target.value))
                }
                placeholder="Search fonts"
                className={`h-10 rounded-full border border-white/10 bg-[#23252b] pl-11 pr-11 ${uiTextBodyClass} text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-white/38 hover:border-[#F2FDAD]/30 hover:bg-[#26292f] focus-visible:border-[#F2FDAD] focus-visible:ring-4 focus-visible:ring-[#F2FDAD]/24 dark:bg-[#23252b]`}
              />
            </div>
          </div>
        </div>
      </header>

      <div className={pageBodyShellClass}>
        <div className="flex items-center justify-between gap-4">
          <div className={`min-w-0 flex flex-wrap items-center gap-3 ${uiTextSmallClass} text-white/62`}>
            <p className={`${uiTextSmallClass} font-medium leading-none text-white`}>
              {visibleFonts.length.toLocaleString()} of{" "}
              {availableFonts.length.toLocaleString()} families
            </p>
            {isPending ? (
              <span className={`rounded-full border border-white/8 bg-[#1a1b1f] px-2.5 py-1 ${uiTextSmallClass} uppercase tracking-[0.18em] text-white/55`}>
                Updating
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-3 self-center">
            <div className="flex items-center gap-1 rounded-[1rem] border border-white/10 bg-[#1f2025] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`grid size-9 place-items-center rounded-[0.8rem] transition ${
                  viewMode === "grid"
                    ? "bg-[#F2FDAD] text-[#111214]"
                    : "text-white/48 hover:bg-[#F2FDAD]/14 hover:text-[#F2FDAD]"
                }`}
                aria-label="Grid view"
              >
                <LayoutGridIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`grid size-9 place-items-center rounded-[0.8rem] transition ${
                  viewMode === "list"
                    ? "bg-[#F2FDAD] text-[#111214]"
                    : "text-white/48 hover:bg-[#F2FDAD]/14 hover:text-[#F2FDAD]"
                }`}
                aria-label="List view"
              >
                <Rows3Icon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {visibleFonts.length > 0 ? (
          viewMode === "list" ? (
            <div className="mt-4 border-t border-white/10">
              {visibleFonts.map((font) => (
                <FontListRow
                  key={font.id}
                  font={font}
                  previewText={previewText}
                  previewSize={previewSize}
                  onPreviewTextChange={setPreviewText}
                  onOpenDetails={navigateToFont}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleFonts.map((font) => (
                <FontCard
                  key={font.id}
                  font={font}
                  previewText={previewText}
                  previewSize={previewSize}
                  onPreviewTextChange={setPreviewText}
                  onOpenDetails={navigateToFont}
                />
              ))}
            </div>
          )
        ) : (
          <div className="mt-4 rounded-[2rem] border border-dashed border-white/12 bg-[#17181c] px-6 py-16 text-center">
            <p className={`${uiTextSmallClass} uppercase tracking-[0.24em] text-white/42`}>
              No matches
            </p>
            <h2 className={`mt-4 ${uiTextTitleClass} font-medium tracking-tight text-white`}>
              {availableFonts.length === 0
                ? "No font files are available yet."
                : "Nothing matches this search."}
            </h2>
            <p className={`mx-auto mt-3 max-w-xl ${uiTextSmallClass} leading-7 text-white/56`}>
              {availableFonts.length === 0
                ? "Add `content/fonts/<id>/family.toml`, put the full upstream in `content/upstreams/<id>`, then run `aube run fonts:sync -- <id>`."
                : "Try a broader term, a different designer name, or a shorter family search."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
