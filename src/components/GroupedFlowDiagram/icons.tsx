import type { CSSProperties } from "react";

const paths: Readonly<Record<string, string>> = {
  cart: "M3 4h3l3 14h13l4-10H7 M10 24h.1 M22 24h.1",
  card: "M4 7h24v18H4z M4 12h24 M8 20h6",
  payment: "M16 3v26 M22 9c-2-4-13-3-12 3 1 5 13 2 13 8 0 6-12 7-15 2",
  shipping: "M3 8h16v15H3z M19 13h6l4 6v4H19 M8 26h.1 M24 26h.1",
  label: "M3 8h18l8 8-8 8H3z M8 12v8 M11 12v8 M15 12v8 M18 12v8",
  lock: "M7 14h18v15H7z M11 14V8c0-8 10-8 10 0v6",
  alert: "M16 3 30 28H2z M16 11v8 M16 23h.1",
  flow: "M4 4h9v8H4z M20 20h9v8h-9z M8 12v12h12 M20 4h9v8h-9z M13 8h7",
  step: "M5 5h22v22H5z M10 16l4 4 8-9",
};

/** Local vectors only. A custom pictograph is text, never HTML, SVG source or an asset URL. */
export function DiagramIcon({ icon, style }: { icon?: string; style?: CSSProperties }) {
  const path = icon && Object.prototype.hasOwnProperty.call(paths, icon) ? paths[icon] : undefined;
  if (!path && icon && /\p{Extended_Pictographic}/u.test(icon)) {
    return <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1, ...style }}>{icon}</span>;
  }
  return <svg aria-hidden="true" width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={path ?? paths.step} />
  </svg>;
}
