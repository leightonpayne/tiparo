import { lazy, Suspense, useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { FontListRow } from "@/components/font-list-row";
import { Input } from "@/components/ui/input";
import { fontLibrary } from "@/data/generated-font-library";
import { previewPresets, type FontEntry } from "@/data/fonts";
import { getFontIdFromPath } from "@/lib/routes";
import { pageBodyShellClass, pageShellClass } from "@/lib/layout";

const FontDetailPage = lazy(() =>
  import("@/components/font-detail-page").then(({ FontDetailPage }) => ({
    default: FontDetailPage,
  })),
);

function getRoutePathFromHash(hash: string) {
  const normalizedHash = hash.replace(/^#/, "");
  return normalizedHash.startsWith("/")
    ? normalizedHash
    : normalizedHash
      ? `/${normalizedHash}`
      : "/";
}

function matchesSearch(font: FontEntry, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [font.family, font.designer, font.foundry, font.license]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewText, setPreviewText] = useState<string>(previewPresets.large);
  const [routePath, setRoutePath] = useState(() =>
    getRoutePathFromHash(window.location.hash),
  );

  useEffect(() => {
    const handleHashChange = () =>
      setRoutePath(getRoutePathFromHash(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const visibleFonts = fontLibrary.filter((font) =>
    matchesSearch(font, searchQuery),
  );
  const activeFontId = getFontIdFromPath(routePath);
  const activeFont =
    activeFontId === null
      ? null
      : (fontLibrary.find((font) => font.id === activeFontId) ?? null);

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
      <Suspense
        fallback={
          <main className="ui-page">
            <AppHeader onHome={navigateHome} back />
            <div className={pageBodyShellClass}>
              <div className="ui-page-heading">
                <h2 className="ui-page-title">{activeFont.family}</h2>
              </div>
              <p role="status" className="ui-description">
                Loading specimens…
              </p>
            </div>
          </main>
        }
      >
        <FontDetailPage font={activeFont} onBack={navigateHome} />
      </Suspense>
    );
  }

  return (
    <main className="ui-page">
      <header className={`${pageShellClass} ui-library-hero`}>
        <h1 className="ui-library-logo">
          <img
            src={`${import.meta.env.BASE_URL}tiparo.svg`}
            alt="Tiparo"
            width={425}
            height={438}
          />
        </h1>
        <div className="ui-search">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search fonts"
            aria-label="Search fonts"
            className="pl-10"
          />
        </div>
      </header>

      <div
        className={
          visibleFonts.length > 0
            ? `${pageBodyShellClass} ui-library-body`
            : pageBodyShellClass
        }
      >
        {visibleFonts.length > 0 ? (
          <div className="ui-font-list">
            {visibleFonts.map((font) => (
              <FontListRow
                key={font.id}
                font={font}
                previewText={previewText}
                onPreviewTextChange={setPreviewText}
                onOpenDetails={navigateToFont}
              />
            ))}
          </div>
        ) : (
          <div className="ui-empty-state">
            <h2 className="ui-section-heading">
              {fontLibrary.length === 0
                ? "No font files are available yet."
                : "Nothing matches this search."}
            </h2>
            <p className="ui-description">
              {fontLibrary.length === 0
                ? "Font previews will appear here when the library has entries."
                : "Try a broader term, a different designer name, or a shorter family search."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
