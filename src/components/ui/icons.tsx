import type { ReactNode } from "react";

type Props = { className?: string };

/* Fills whatever box it is given — CountFigure sizes the wrapper, so a mark
   and the figure under it scale on the same clamp. */
const DEFAULT_SIZE = "h-full w-full";

/**
 * Two families, deliberately.
 *
 * The Scale row is platform logos, which are only recognisable as the solid
 * shapes people already know. The Projection row is ideas rather than brands,
 * so those are drawn as line work — lighter on the page, and it keeps the
 * broadcast mark from reading as a fifth logo. Each row is internally
 * consistent, and the two never appear side by side.
 */
function Solid({ children, className = DEFAULT_SIZE }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden
      className={"shrink-0 " + className}
    >
      {children}
    </svg>
  );
}

function Line({ children, className = DEFAULT_SIZE }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={"shrink-0 " + className}
    >
      {children}
    </svg>
  );
}

/* ── Scale ─────────────────────────────────────────────────────────── */

export function IconStudents(p: Props) {
  return (
    <Solid {...p}>
      <path d="M12 3 1 8.5l3 1.5v5.2c0 .4-.2.8-.5 1L3 21h3l-.5-4.8c-.3-.2-.5-.6-.5-1v-4.4l7 3.5 11-5.5L12 3Z" />
      <path d="M7 13.4v3.1c0 1.9 2.2 3.5 5 3.5s5-1.6 5-3.5v-3.1l-5 2.5-5-2.5Z" />
    </Solid>
  );
}

export function IconYouTube(p: Props) {
  return (
    <Solid {...p}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </Solid>
  );
}

export function IconTelegram(p: Props) {
  return (
    <Solid {...p}>
      <path d="M23.9 3.6 20.3 20.6c-.3 1.2-1 1.5-2 .9l-5.5-4-2.7 2.6c-.3.3-.6.6-1.2.6l.4-5.6L19.5 6c.4-.4-.1-.6-.7-.2L6.2 13.7l-5.4-1.7c-1.2-.4-1.2-1.2.2-1.7L22.4 2c1-.4 1.8.2 1.5 1.6Z" />
    </Solid>
  );
}

export function IconFacebook(p: Props) {
  return (
    <Solid {...p}>
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z" />
    </Solid>
  );
}

export function IconTikTok(p: Props) {
  return (
    <Solid {...p}>
      <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.8 5.8 0 0 0-.8-.1 5.8 5.8 0 1 0 5.8 5.8V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.3-1.5Z" />
    </Solid>
  );
}

/* ── Projection ────────────────────────────────────────────────────── */

export function IconReach(p: Props) {
  return (
    <Line {...p}>
      <circle cx="12" cy="12" r="2.1" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
    </Line>
  );
}

export function IconRoom(p: Props) {
  return (
    <Line {...p}>
      <path d="M16 20.5v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1.6" />
      <circle cx="9" cy="7.2" r="3.3" />
      <path d="M22 20.5v-1.6a4 4 0 0 0-3-3.9M16.2 4.1a3.3 3.3 0 0 1 0 6.3" />
    </Line>
  );
}

export function IconLivestream(p: Props) {
  return (
    <Line {...p}>
      <rect x="2" y="6" width="13.2" height="12" rx="2.6" />
      <path d="M15.2 10.6 21.6 7v10l-6.4-3.6v-2.8Z" />
    </Line>
  );
}

export function IconSocial(p: Props) {
  return (
    <Line {...p}>
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" />
    </Line>
  );
}

export function IconElsewhere(p: Props) {
  return (
    <Line {...p}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M2.8 12h18.4" />
      <path d="M12 2.8a14 14 0 0 1 0 18.4 14 14 0 0 1 0-18.4Z" />
    </Line>
  );
}
