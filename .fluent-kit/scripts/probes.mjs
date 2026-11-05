// What verify.mjs asks the page after it has loaded. Each function runs inside the browser (page.evaluate), so each is
// self-contained: nothing here may refer to anything outside its own body. They return short strings, empty when fine.

// A control drawn on top of text it does not belong to (a fixed height or an absolute position that does not fit this
// width). Things in another layer (an open drawer, menu or tooltip over the page) are left out. Runs in the page.
export function overlapProbe() {
  const CTRL = ".fui-Button, .fui-Link, .fui-Input, .fui-Dropdown, .fui-Combobox, .fui-Checkbox, .fui-Switch";
  const layer = (el) => el.closest("[data-portal-node], [role=dialog], [role=menu], [role=listbox], [role=tooltip]");
  const ctrls = [...document.querySelectorAll(CTRL)].filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).visibility !== "hidden"; });
  if (!ctrls.length || ctrls.length > 400) return [];
  const texts = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t && texts.length < 3000; t = w.nextNode()) {
    const el = t.parentElement;
    if (!el || !t.textContent.trim() || el.closest(CTRL) || el.closest("[aria-hidden=true]")) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.opacity === "0") continue;
    // Only the part of the text a reader can see: a container that clips (a line clamp, overflow hidden) hides the rest.
    let clip = null;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a);
      if (/(hidden|clip|auto|scroll)/.test(o.overflowX + o.overflowY)) { const c = a.getBoundingClientRect(); clip = clip ? { left: Math.max(clip.left, c.left), top: Math.max(clip.top, c.top), right: Math.min(clip.right, c.right), bottom: Math.min(clip.bottom, c.bottom) } : { left: c.left, top: c.top, right: c.right, bottom: c.bottom }; }
    }
    const range = document.createRange(); range.selectNodeContents(t);
    for (const raw of range.getClientRects()) {
      const r = clip ? { left: Math.max(raw.left, clip.left), top: Math.max(raw.top, clip.top), right: Math.min(raw.right, clip.right), bottom: Math.min(raw.bottom, clip.bottom) } : raw;
      if (r.right - r.left > 1 && r.bottom - r.top > 1) texts.push({ r: { ...r, width: r.right - r.left, height: r.bottom - r.top }, el, t: t.textContent.trim() });
    }
  }
  const out = [];
  for (const c of ctrls) {
    const a = c.getBoundingClientRect();
    for (const x of texts) {
      if (c.contains(x.el) || x.el.contains(c) || layer(c) !== layer(x.el)) continue;
      const b = x.r, iw = Math.min(a.right, b.right) - Math.max(a.left, b.left), ih = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (iw > 4 && ih > 4 && iw * ih > 0.3 * Math.min(a.width * a.height, b.width * b.height)) { out.push(`"${(c.textContent || c.getAttribute("aria-label") || "").trim().slice(0, 20)}" covers "${x.t.slice(0, 30)}"`); break; }
    }
    if (out.length >= 4) break;
  }
  return out;
          }
// Cards in one grid (or wrapping row) that are not one size: the content decided how tall each card is. Runs in the page.
export function gridProbe() {
  const out = [];
  for (const g of document.querySelectorAll("div, section, ul")) {
    const gs = getComputedStyle(g);
    if (gs.display !== "grid" && !(gs.display === "flex" && gs.flexWrap !== "nowrap")) continue;
    const cards = [...g.children].filter((c) => { const r = c.getBoundingClientRect(), cs = getComputedStyle(c); return r.width > 100 && r.height > 60 && cs.visibility !== "hidden" && (cs.boxShadow !== "none" || parseFloat(cs.borderTopWidth) > 0); });
    if (cards.length < 3) continue;
    const w = cards.map((c) => Math.round(c.getBoundingClientRect().width)), h = cards.map((c) => Math.round(c.getBoundingClientRect().height));
    if (Math.max(...w) - Math.min(...w) > 2 || Math.max(...h) - Math.min(...h) <= 2) continue; // not a uniform grid, or already one size
    out.push(`${cards.length} cards, ${Math.min(...h)} to ${Math.max(...h)}px high`);
    if (out.length >= 3) break;
  }
  return out;
}
// An open dropdown, combobox or menu taller than 340px: Fluent sizes it to the window, so a long list fills the screen.
export function popupProbe() {
  const out = [];
  for (const el of document.querySelectorAll("[role=listbox], [role=menu]")) {
    let pop = el;
    for (let i = 0; i < 4 && pop && !/^(absolute|fixed)$/.test(getComputedStyle(pop).position); i++) pop = pop.parentElement;
    if (!pop || !/^(absolute|fixed)$/.test(getComputedStyle(pop).position)) continue;
    const h = Math.round(pop.getBoundingClientRect().height);
    if (h > 340) out.push(`${h}px high in a ${window.innerHeight}px window`);
  }
  return out.slice(0, 2);
}
