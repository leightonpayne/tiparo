import { useLayoutEffect, useRef } from "react";

export function useScrollReveal<T extends HTMLElement>(scopeKey: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || preference.matches || !("IntersectionObserver" in window)) {
      return;
    }

    const targets = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    let stopped = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (stopped) return;
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          if (
            !entry.isIntersecting ||
            target.dataset.revealState !== "pending"
          ) {
            continue;
          }
          target.dataset.revealState = "visible";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );

    const finish = (target: HTMLElement) => {
      observer.unobserve(target);
      target.removeAttribute("data-reveal-state");
    };
    const showAll = () => {
      stopped = true;
      observer.disconnect();
      targets.forEach(finish);
    };
    const onPreferenceChange = () => {
      if (preference.matches) showAll();
    };
    const onInteract = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-reveal]");
      if (target && root.contains(target)) finish(target);
    };
    const onAnimationEnd = (event: AnimationEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.hasAttribute("data-reveal") &&
        (event.animationName === "ui-content-enter" ||
          event.animationName === "ui-fade-in")
      ) {
        finish(event.target);
      }
    };

    for (const target of targets) {
      if (target.contains(document.activeElement)) continue;
      target.dataset.revealState = "pending";
      observer.observe(target);
    }
    root.addEventListener("focusin", onInteract);
    root.addEventListener("pointerdown", onInteract);
    root.addEventListener("animationend", onAnimationEnd);
    preference.addEventListener("change", onPreferenceChange);

    return () => {
      showAll();
      root.removeEventListener("focusin", onInteract);
      root.removeEventListener("pointerdown", onInteract);
      root.removeEventListener("animationend", onAnimationEnd);
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, [scopeKey]);

  return ref;
}
