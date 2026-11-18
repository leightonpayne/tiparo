import type { ReactNode } from "react";

import { pageHeaderShellClass } from "@/lib/layout";

export function AppHeader({
  onHome,
  back = false,
  children,
}: {
  onHome: () => void;
  back?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="ui-header">
      <div className={pageHeaderShellClass}>
        <button
          type="button"
          onClick={onHome}
          className="ui-brand"
          aria-label={back ? "Back to font library" : "Font library"}
        >
          <span className="grid size-9 place-items-center">
            <img
              src={`${import.meta.env.BASE_URL}tiparo.svg`}
              alt=""
              aria-hidden="true"
              className="size-9 object-contain"
            />
          </span>
        </button>
        {children}
      </div>
    </header>
  );
}
