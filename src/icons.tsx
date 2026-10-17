/**
 * The study's own line icons on a 24-unit grid, drawn for GIFbank. None is
 * copied from the reference. `Icon` draws in the current text colour.
 */
const PATHS = {
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 21 21",
  help: "M4 4h16v16H4zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 16.5h.01",
  pin: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  chevron: "M6 9l6 6 6-6",
  right: "M9 6l6 6-6 6",
  left: "M15 6l-6 6 6 6",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  user: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20a7 7 0 0 1 14 0",
  bell: "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 18.5a2 2 0 0 0 4 0",
  mail: "M3.5 6h17v12h-17zM3.5 6l8.5 7 8.5-7",
  transfer: "M5 8h13l-3-3M19 16H6l3 3",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  send: "M21 3 3 10.5l7 2.5 2.5 7z",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  gear: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
  card: "M3 6h18v12H3zM3 10h18M6.5 14.5h4",
  house: "M3.5 11 12 4l8.5 7M6 9.5V20h4.5v-5h3v5H18V9.5",
  piggy: "M5 12a7 5.5 0 0 1 12.5-3.4L20 8l-.5 3 1.5 1-1.5 2.5h-2L16 17v2.5h-2.5V18h-4v1.5H7V17a6 6 0 0 1-2-5zM14.5 10.5h.01",
  check: "M3 7h18v10H3zM6 14h4M14.5 13.5l1.5-2 1.5 1 1.5-2",
  certificate: "M5 3h14v12H5zM9 8h6M9 11h4M10 15l-1.5 6 3.5-2 3.5 2-1.5-6",
  loan: "M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 10l9-6 9 6z",
  tag: "M3 12V4h8l10 10-8 8zM7.5 8.5h.01",
  close: "M6 6l12 12M18 6 6 18",
  tick: "M5 12.5l4.5 4.5L19 7.5",
  print: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z",
  eye: "M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 5.6A10 10 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a17 17 0 0 1-3.2 4M6.5 6.9C3.6 8.6 2 12 2 12s3.5 6.5 10 6.5a9.6 9.6 0 0 0 4.2-.9M9.9 9.9a3 3 0 0 0 4.2 4.2",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  plus: "M12 5v14M5 12h14",
  phone: "M8 3h8v18H8zM11 18h2",
  shield: "M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6z",
  logout: "M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10",
  chat: "M4 5h16v11H9l-5 4z",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, className, stroke = 1.8 }: { name: IconName; size?: number; className?: string; stroke?: number }) {
  return (
    <svg className={`icon${className ? ` ${className}` : ""}`} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** GIFbank's mark: the letters GIF, white, on a green square, then the name. */
export function Mark({ small }: { small?: boolean }) {
  return (
    <span className={`mark${small ? " mark--small" : ""}`}>
      <span className="mark__tile" aria-hidden="true">GIF</span>
      <span className="mark__name" aria-hidden="true">bank</span>
    </span>
  );
}
