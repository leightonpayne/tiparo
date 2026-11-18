import { mockupIcons } from "@/data/mockup-icons";
import type { MockupIconId } from "@/lib/mockup";

/** Original Phosphor geometry; the adjacent text supplies its meaning. */
export function MockupIcon({ name }: { name: MockupIconId }) {
  const icon = mockupIcons[name];
  return (
    <svg
      className="mockup-print-icon"
      data-mockup-icon={name}
      data-icon-source={icon.name}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={256}
      height={256}
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={icon.path} />
    </svg>
  );
}
