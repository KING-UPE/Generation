/**
 * Resolve a brand custom property to a colour string a canvas will accept.
 *
 * The palette has one home — the ramp at the top of `globals.css` — and
 * everything that paints through CSS can simply point at it. A 2D canvas
 * cannot: `fillStyle` takes a colour string and knows nothing about custom
 * properties, `hsl()` triples or `calc()`. So the browser is asked to do the
 * resolving, by handing the value to a throwaway element and reading back what
 * it computed. Nothing here holds a copy of the palette.
 *
 * Not cached, deliberately: it runs a couple of times per canvas at mount, and
 * a cache would go stale the moment `--brand-h` is changed on the fly.
 */
export function brandColor(token: string, alpha = 1): string {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color; // "rgb(255, 46, 116)"
  probe.remove();

  const rgb = computed.slice(computed.indexOf("(") + 1, computed.indexOf(")"));
  return alpha >= 1 ? `rgb(${rgb})` : `rgba(${rgb}, ${alpha})`;
}
