import { getConfig } from '../core/config';
import { findShare } from '../core/find';
import { isEnabled } from '../core/gate';
import { controlsOf } from '../core/infer';
import { notify } from '../core/notify';
import { refresh } from '../core/overrides';
import { encodeShare } from '../core/payload';
import { changedCount, entries, getEntry, onRegistryChange, overridesOf, resetAll, resetEntry, subscribeEntry } from '../core/registry';
import { buildShare, shareUrl } from '../core/share';
import { snippet } from '../core/snippet';
import { st } from '../core/state';
import { flush, importShare } from '../core/storage';
import type { Entry, SharePayload } from '../core/types';
import { body, empty } from './body';
import type { Body } from './body';
import { copy } from './clipboard';
import { attr, h } from './dom';
import { footer } from './footer';
import type { Footer } from './footer';
import { header } from './header';
import { editable, matches } from './hotkey';
import { count, t } from './i18n';
import { layout } from './layout';
import { ringButton } from './ring';
import { adopt } from './styles';
import { tabOrder, tabs } from './tabs';
import type { Tabs } from './tabs';
import { toaster } from './toast';
import { setUi, ui } from './ui';

/**
 * Longest share link the panel hands out (whole URL). nginx's default request-line buffer is
 * 8 KB (414 above it) and Vercel's CDN allows 14 KB; past this the raw payload is copied instead.
 */
export const MAX_URL = 8000;

/** The toast `key` (its `{n}` tweaks across `{m}` rigs) for payload `p`. */
function tally(key: 'linkCopied' | 'imported', p: SharePayload): string {
  const rows = Object.values(p.o);
  const n = rows.reduce((sum, row) => sum + Object.keys(row).length, 0);
  return t(key).replace('{n}', count(n, 'tweaks')).replace('{m}', count(rows.length, 'rigs'));
}

export class Panel extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private built = false;
  private isOpen = false;
  private tab?: string;
  private order: string[] = [];
  private view?: Body;
  private collapsed = new Set<string>();
  private offs: (() => void)[] = [];
  private subs = new Map<string, () => void>();
  private ring = ringButton();
  private layer = h('div', { class: 'layer' });
  private bodyEl = h('div', { class: 'body', 'data-lenis-prevent': true, 'data-scroll-prevent': true });
  private panel = h('section', { class: 'panel', role: 'dialog', tabindex: -1 });
  private toaster = toaster();
  private toast = (text: string): void => this.toaster.say(text);
  private tabs!: Tabs;
  private foot!: Footer;
  private query = '';
  /** Pending removal of a collapsed panel's tab DOM. */
  private drop?: ReturnType<typeof setTimeout>;
  private layout = layout(this.ring.el, this.panel, () => this.show());

  connectedCallback(): void {
    if (!this.built) this.build();
    const stop = (e: Event): void => e.stopPropagation();
    for (const type of ['wheel', 'touchmove']) {
      this.addEventListener(type, stop, { passive: true });
      this.offs.push(() => this.removeEventListener(type, stop));
    }
    const key = (e: KeyboardEvent): void => {
      const { hotkey } = getConfig();
      if (!hotkey || !matches(e, hotkey) || editable(e) || !this.alive()) return;
      e.preventDefault();
      if (this.isOpen) this.hide();
      else this.show();
    };
    const resize = (): void => {
      this.layout.ring();
      if (this.isOpen) this.layout.panel();
    };
    addEventListener('keydown', key);
    addEventListener('resize', resize);
    this.offs.push(
      () => removeEventListener('keydown', key),
      () => removeEventListener('resize', resize),
      onRegistryChange(() => this.registryChanged()),
    );
    // Content that grows (a note expanded, the bezier editor shown) must not push the panel off-screen.
    const grow = new ResizeObserver(() => this.isOpen && this.layout.panel());
    grow.observe(this.panel);
    this.offs.push(() => grow.disconnect());
    // In place: one host attribute switches the colour tokens, nothing is rebuilt.
    const theme = (): void => {
      const { theme: v } = getConfig();
      attr(this, 'data-theme', v === 'light' || v === 'auto' ? v : 'dark');
    };
    theme();
    st().reconfigured = theme;
    this.offs.push(() => {
      if (st().reconfigured === theme) st().reconfigured = undefined;
    });
    this.layout.ring();
    this.watch();
    // First mount ever: everything already on the page counts as seen (no "new" flood).
    if (!ui().seen) setUi({ seen: entries().map((e) => e.id) });
    this.badge();
    // Restored open after a reload: shown, but focus stays with the page.
    if (ui().open) this.show(undefined, false);
  }

  disconnectedCallback(): void {
    this.offs.forEach((off) => off());
    this.subs.forEach((off) => off());
    this.tabs.stop();
    this.offs = [];
    this.subs.clear();
    this.isOpen = false;
    this.view = undefined;
    clearTimeout(this.drop);
    this.bodyEl.replaceChildren();
  }

  /** Opens the panel on `id` when it is registered, else on the last tab. */
  show(id?: string, focus = true): void {
    if (!this.alive()) return;
    const ids = entries().map((e) => e.id);
    const opening = !this.isOpen;
    if (opening) {
      clearTimeout(this.drop);
      this.isOpen = true;
      this.toggleAttribute('open', true);
      setUi({ open: true });
      this.chrome();
      this.order = tabOrder(ids, ui().seen ?? [], getConfig().order);
      this.tabs.filter(this.query);
      this.tabs.show(this.order);
    }
    const target = [id, this.tab, ui().tab, this.order[0]].find((i) => i !== undefined && ids.includes(i));
    if (target === undefined) this.render();
    else if (target !== this.tab || !this.view) this.pick(target);
    if (opening && focus) this.panel.focus({ preventScroll: true });
  }

  hide(): void {
    if (!this.isOpen) return;
    const focused = this.root.activeElement;
    this.isOpen = false;
    this.view = undefined;
    this.toggleAttribute('open', false);
    setUi({ open: false });
    this.badge();
    if (focused) this.ring.el.focus();
    // After the close transition: no tab DOM (and no preview animation) lives on while collapsed.
    this.drop = setTimeout(() => this.bodyEl.replaceChildren(), 160);
  }

  private build(): void {
    this.built = true;
    adopt(this.root);
    // Controls ask for toasts this way (they don't hold the panel).
    this.root.addEventListener('motionrig-toast', (e) => this.toast((e as CustomEvent<string>).detail));
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
    this.chrome();
    this.root.append(this.layer, this.ring.el, this.panel);
  }

  /** Header, tabs and footer carry config strings: rebuilt on each open, so a later `configure({ locale })` shows. */
  private chrome(): void {
    const head = header({
      query: this.query,
      search: (q) => this.tabs.filter((this.query = q)),
      share: () => this.share(),
      collapse: () => this.hide(),
      paste: (text) => this.paste(text),
    });
    this.layout.head(head);
    this.tabs?.stop();
    this.tabs = tabs((id) => this.pick(id));
    this.foot = footer({
      copy: () => {
        const e = getEntry(this.tab!)!;
        void this.copy(snippet(e), `${t('codeCopied')} · ${e.meta.title || e.id}`);
      },
      resetTab: () => this.reset(() => resetEntry(this.tab!), Object.keys(overridesOf(this.tab!)).length > 0, t('tabReset')),
      resetAll: () => this.reset(resetAll, changedCount() > 0, t('allReset')),
    });
    this.panel.setAttribute('aria-label', t('panel'));
    // Inside the footer, placed from its top: a footer wrapped onto two lines never covers it.
    this.foot.el.append(this.toaster.el);
    this.panel.replaceChildren(head, this.tabs.el, this.bodyEl, this.foot.el);
  }

  private async copy(text: string, done: string): Promise<void> {
    if (await copy(text, this.panel)) this.toast(done);
  }

  private share(): void {
    if (!changedCount()) this.toast(t('nothingChanged'));
    else {
      const p = buildShare();
      const url = shareUrl(p);
      // Too long to survive servers and messengers: never hand out a link that breaks; the payload works everywhere.
      if (url.length > MAX_URL) void this.copy(encodeShare(p), t('payloadCopied'));
      // Says what the link carries: the payload's own tweaks and rigs, every page included.
      else void this.copy(url, tally('linkCopied', p));
    }
  }

  /** Imports a pasted link or payload, as opening the link would; `false` lets the paste through. */
  private paste(text: string): boolean {
    const p = findShare(text);
    if (!p) return false;
    importShare(p);
    flush();
    refresh();
    // Ids not on this page changed too: badge and marks re-read.
    notify();
    this.toast(tally('imported', p));
    return true;
  }

  private reset(run: () => void, any: boolean, done: string): void {
    if (!any) return this.toast(t('nothingChanged'));
    // Marks, badge and the open tab follow from the reset's own notifications.
    run();
    this.toast(done);
  }

  /** The gate can close after mount (`configure`); the panel then stays out of sight. */
  private alive(): boolean {
    const on = isEnabled();
    this.hidden = !on;
    return on;
  }

  private watch(): void {
    for (const { id } of entries()) {
      if (!this.subs.has(id)) this.subs.set(id, subscribeEntry(id, () => this.entryChanged(id)));
    }
  }

  private entryChanged(id: string): void {
    if (!this.alive()) return;
    this.tabs.mark(id);
    this.badge();
    if (this.isOpen && id === this.tab) this.view?.sync();
  }

  /** Entry added or replaced (HMR), or values reset: only new chips, marks and the affected tab change. */
  private registryChanged(): void {
    if (!this.alive()) return;
    this.watch();
    this.badge();
    if (!this.isOpen) return;
    const fresh = entries().map((e) => e.id).filter((id) => !this.order.includes(id));
    if (fresh.length) {
      this.order.push(...fresh);
      this.tabs.show(this.order);
      this.tabs.active(this.tab);
    } else this.order.forEach((id) => this.tabs.mark(id));
    const e = this.tab === undefined ? undefined : getEntry(this.tab);
    if (!e) this.show();
    else if (!this.view || this.view.entry !== e || this.view.groups !== controlsOf(e)) this.render(e);
    else this.view.sync();
  }

  private pick(id: string): void {
    const e = getEntry(id);
    if (!e) return;
    this.tab = id;
    const seen = ui().seen ?? [];
    setUi({ tab: id, seen: seen.includes(id) ? seen : [...seen, id] });
    this.tabs.active(id);
    this.tabs.mark(id);
    this.render(e);
    // So the designer sees what they tune (§10.1).
    this.layout.clear(e.meta.target);
  }

  private render(e?: Entry): void {
    this.view = e && body(e, { collapsed: this.collapsed, toast: this.toast, layer: this.layer });
    this.bodyEl.replaceChildren(this.view ? this.view.el : empty());
    this.bodyEl.scrollTop = 0;
    this.foot.tab(e && (e.meta.title || e.id));
    this.layout.panel();
  }

  private badge(): void {
    this.ring.count(changedCount());
  }
}
