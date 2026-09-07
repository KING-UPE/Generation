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

export function IconWhatsApp(p: Props) {
  return (
    <Solid {...p}>
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.1.9.9-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
      <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </Solid>
  );
}

/* ── Festival ──────────────────────────────────────────────────────── */

export function IconFood(p: Props) {
  return (
    <Solid {...p}>
      <path d="M8.4 2v6.1a2.4 2.4 0 0 0 1.5 2.2V22h1.4V10.3a2.4 2.4 0 0 0 1.5-2.2V2h-1.2v5.1h-.9V2h-1.2v5.1h-.9V2H8.4Z" />
      <path d="M17.1 2c-1.4 1.7-2.2 3.9-2.2 6.2 0 2 .7 3.4 1.9 3.9V22h1.4V2h-1.1Z" />
    </Solid>
  );
}

export function IconEducation(p: Props) {
  return (
    <Solid {...p}>
      <path d="M12 6.4C10.3 5 8 4.2 5.5 4.2c-1.2 0-2.4.2-3.5.6v13.4c1.1-.4 2.3-.6 3.5-.6 2.5 0 4.8.8 6 2V6.4Z" />
      <path d="M13.4 6.4V19.6c1.2-1.2 3.5-2 6-2 1.2 0 2.4.2 3.5.6V4.8c-1.1-.4-2.3-.6-3.5-.6-2.5 0-4.8.8-6 2.2Z" />
    </Solid>
  );
}

export function IconGaming(p: Props) {
  return (
    <Solid {...p}>
      <path d="M17.4 6.2H6.6A4.6 4.6 0 0 0 2 10.8v2.6a4.4 4.4 0 0 0 4.4 4.4c1.4 0 2.2-.7 2.9-1.5l.6-.7h4.2l.6.7c.7.8 1.5 1.5 2.9 1.5a4.4 4.4 0 0 0 4.4-4.4v-2.6a4.6 4.6 0 0 0-4.6-4.6ZM9.6 12.7H8.3V14H7v-1.3H5.7v-1.3H7v-1.3h1.3v1.3h1.3v1.3Zm5 1.2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm2.3-2.6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
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
