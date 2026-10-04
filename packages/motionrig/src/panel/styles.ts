import { controlCss } from './controls/styles';
import { h } from './dom';

let sheet: CSSStyleSheet | undefined;

// Light tokens (§10.5). Yellow stays the fill (ring, primary button, badge, dots); as text or a
// thin stroke it can't hold contrast on white, so those draw in --mr-hi, a dark amber (≥ 5:1).
const light = `color-scheme:light;--mr-bg:#fff;--mr-surface:#f4f4f6;--mr-raise:#e9e9ed;--mr-line:rgb(0 0 0 / .18);
--mr-text:#17171a;--mr-muted:#5f5f68;--mr-blue:#0a62c7;--mr-red:#b3261e;--mr-fg:0 0 0;--mr-hi:#7a5f00;
--mr-hi-rgb:122 95 0;--mr-hi-soft:#7a5f00;--mr-shadow:rgb(0 0 0 / .16);--mr-scrim:rgb(255 255 255 / .88);
--mr-check-a:#dcdce1;--mr-check-b:#f4f4f6;--mr-ring:var(--mr-accent);--mr-mark:var(--mr-ink);--mr-badge:var(--mr-ink);
--mr-badge-text:var(--mr-accent);--mr-dot-edge:var(--mr-hi);
--mr-halo:var(--mr-hi);--mr-knob-focus:var(--mr-hi);--mr-arm:rgb(122 95 0 / .8);--mr-tick:rgb(0 0 0 / .5)`;

// Ring, panel and Locate box are placed with `translate`, never `transform`: `scale` (press,
// open/close, Locate intro) then scales around the element's own origin, while a scaled
// `transform: translate()` drifted the ring off the pointer in proportion to its x/y.
// Identity (§10.5): dark by default (`theme`), rig-yellow accent, system fonts only. Yellow means
// "the ring" or "changed by you"; blue means "new"; red means "destructive / reload".
export const css = `
:host{all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;contain:layout style;
--mr-bg:#111113;--mr-surface:#19191c;--mr-raise:#222226;--mr-line:rgb(255 255 255 / .08);--mr-text:#f2f2f3;
--mr-muted:#8b8b93;--mr-accent:#ffd400;--mr-blue:#3d9bff;--mr-red:#ff4d3d;--mr-ink:#111113;
--mr-fg:255 255 255;--mr-hi:var(--mr-accent);--mr-hi-rgb:255 212 0;--mr-hi-soft:rgb(255 212 0 / .55);
--mr-shadow:rgb(0 0 0 / .45);--mr-scrim:rgb(17 17 19 / .88);--mr-check-a:#4a4a50;--mr-check-b:#2c2c31;--mr-ring:var(--mr-bg);
--mr-mark:var(--mr-accent);--mr-badge:var(--mr-accent);--mr-badge-text:var(--mr-ink);--mr-dot-edge:transparent;
--mr-halo:rgb(255 212 0 / .45);--mr-knob-focus:var(--mr-accent);--mr-arm:rgb(255 212 0 / .45);--mr-tick:rgb(255 255 255 / .3);
--mr-sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
--mr-mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,monospace;--mr-ease:cubic-bezier(.2,.8,.2,1);
color-scheme:dark;font:12px/1.4 var(--mr-sans);color:var(--mr-text);-webkit-font-smoothing:antialiased;
-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent;text-align:left}
:host([data-theme="light"]){${light}}
@media (prefers-color-scheme:light){:host([data-theme="auto"]){${light}}}
:host([hidden]),[hidden]{display:none!important}
*,*::before,*::after{box-sizing:border-box}
button,input,select,textarea{font:inherit;color:inherit;margin:0;letter-spacing:inherit}
button{cursor:pointer;background:none;border:0;padding:0}
:focus{outline:none}
:focus-visible{outline:2px solid var(--mr-hi);outline-offset:2px}
p{margin:0}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.offscreen{position:fixed;left:-9999px;top:0;opacity:0}
.icon{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
.icon-play path{fill:currentColor;stroke:none}
.mark{color:var(--mr-mark);flex:none;overflow:visible}
.brand .mark,.empty .mark{color:var(--mr-hi)}
.mark-turn{transform-origin:12px 12px;transition:transform .5s var(--mr-ease)}

.ring{position:absolute;left:0;top:0;width:40px;height:40px;display:grid;place-items:center;border-radius:50%;
translate:var(--x,16px) var(--y,16px);background:var(--mr-ring);pointer-events:auto;touch-action:none;
user-select:none;-webkit-user-select:none;box-shadow:0 10px 28px var(--mr-shadow),inset 0 0 0 1px rgb(var(--mr-fg) / .09);
transition:opacity .16s var(--mr-ease),scale .16s var(--mr-ease),visibility 0s}
.ring:hover .mark-turn{transform:rotate(90deg)}
.ring:active{scale:.94}
.ring:focus-visible{outline-offset:3px}
:host([open]) .ring{opacity:0;scale:.8;visibility:hidden;transition:opacity .16s var(--mr-ease),scale .16s var(--mr-ease),visibility 0s .16s}
.badge{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;
background:var(--mr-badge);color:var(--mr-badge-text);font:700 10px/17px var(--mr-mono);text-align:center;box-shadow:0 0 0 2px var(--mr-bg)}

.panel{position:absolute;left:0;top:0;display:flex;flex-direction:column;width:min(360px,100vw - 16px);
max-height:min(80vh,760px);translate:var(--x,16px) var(--y,16px);transform-origin:0 100%;
background:var(--mr-bg);border-radius:12px;overflow:hidden;pointer-events:auto;
box-shadow:0 24px 64px var(--mr-shadow),inset 0 0 0 1px var(--mr-line);
opacity:0;scale:.96;visibility:hidden;transition:opacity .16s var(--mr-ease),scale .16s var(--mr-ease),visibility 0s .16s}
:host([open]) .panel{opacity:1;scale:1;visibility:visible;transition-delay:0s}
.panel:focus-visible{outline:none}

.head{display:flex;align-items:center;gap:6px;padding:10px 10px 10px 12px;border-bottom:1px solid var(--mr-line);
cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;flex:none}
.head:active{cursor:grabbing}
.brand{display:flex;align-items:center;gap:3px;flex:none;margin-right:8px}
.word{font:600 11px/1 var(--mr-mono);letter-spacing:-.02em}
.search{flex:1;min-width:0;display:flex;align-items:center;gap:6px;height:26px;padding:0 8px;border-radius:7px;
background:var(--mr-surface);box-shadow:inset 0 0 0 1px var(--mr-line);color:var(--mr-muted);cursor:text}
.search:focus-within{outline:2px solid var(--mr-hi);outline-offset:1px}
.search input{flex:1;min-width:0;height:100%;padding:0;border:0;background:none;color:var(--mr-text)}
.search input::placeholder{color:var(--mr-muted)}
.search input:focus-visible{outline:none}
.search input::-webkit-search-cancel-button{-webkit-appearance:none}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:26px;padding:0 9px;border-radius:7px;
white-space:nowrap;font-weight:500;transition:background .12s,color .12s}
.ghost,.icon-btn{color:var(--mr-muted)}
.ghost:hover,.icon-btn:hover{background:var(--mr-raise);color:var(--mr-text)}
.icon-btn{width:26px;padding:0}
.primary{background:var(--mr-accent);color:var(--mr-ink);font-weight:600}
.primary:hover{background:#ffe03d}
.armed,.armed:hover{background:rgb(255 77 61 / .14);color:var(--mr-red)}

.tabs{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;max-height:104px;overflow-y:auto;overscroll-behavior:contain;
border-bottom:1px solid var(--mr-line);flex:none;scrollbar-width:thin;scrollbar-color:rgb(var(--mr-fg) / .14) transparent}
.tabs:not(:has(.chip)){display:none}
.tabs.all{max-height:min(40vh,320px)}
.more-tabs{height:24px;padding:0 9px;border-radius:7px;color:var(--mr-text);font:500 11px var(--mr-mono);
box-shadow:inset 0 0 0 1px var(--mr-line);background:var(--mr-surface)}
.more-tabs:hover{background:var(--mr-raise)}
.seen-all{height:24px;padding:0 8px;border-radius:7px;color:var(--mr-blue);font:500 11px var(--mr-sans)}
.seen-all:hover{background:rgb(61 155 255 / .12)}
.chip{position:relative;display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;border-radius:7px;
color:var(--mr-muted);box-shadow:inset 0 0 0 1px var(--mr-line);max-width:100%;transition:color .12s,background .12s}
.chip:hover{color:var(--mr-text);box-shadow:inset 0 0 0 1px rgb(var(--mr-fg) / .16)}
.chip[aria-pressed="true"]{color:var(--mr-text);background:var(--mr-raise);box-shadow:inset 0 0 0 1px rgb(var(--mr-fg) / .2)}
.chip .title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dot{position:relative;width:6px;height:6px;border-radius:50%;background:var(--mr-accent);box-shadow:0 0 0 1px var(--mr-dot-edge);flex:none}
.new{font:600 9px/15px var(--mr-mono);padding:0 5px;border-radius:4px;color:var(--mr-blue);background:rgb(61 155 255 / .15)}
.tabs-none{color:var(--mr-muted);padding:3px 0}

.body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 12px 10px;
scrollbar-width:thin;scrollbar-color:rgb(var(--mr-fg) / .14) transparent}
.tab-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px}
.tab-title{flex:1;display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px;min-width:0;padding-top:2px}
h2{margin:0;font:600 14px/1.3 var(--mr-sans);letter-spacing:-.01em;overflow-wrap:anywhere}
.tab-id{font:11px/1.3 var(--mr-mono);color:var(--mr-muted)}
.applies{align-self:center;font:500 10px/16px var(--mr-mono);padding:0 6px;border-radius:4px;color:var(--mr-muted);
box-shadow:inset 0 0 0 1px var(--mr-line)}
.applies[data-applies="replay"]{color:var(--mr-blue);box-shadow:inset 0 0 0 1px rgb(61 155 255 / .35)}
.applies[data-applies="reload"]{color:var(--mr-red);box-shadow:inset 0 0 0 1px rgb(255 77 61 / .35)}
.tab-acts{display:flex;gap:2px;flex:none;margin-top:-2px}
.note-box{margin:-2px 0 14px}
.note{color:var(--mr-muted);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;white-space:pre-line}
.note.full{display:block}
.more{margin-top:3px;color:var(--mr-text);font-weight:500;text-decoration:underline;text-underline-offset:2px;
text-decoration-color:rgb(var(--mr-fg) / .3)}

.group+.group{margin-top:8px}
.plain:not(:first-of-type){margin-top:12px;padding-top:6px;border-top:1px solid var(--mr-line)}
.group-head{display:flex;align-items:center;gap:8px;width:100%;padding:8px 0 4px;color:var(--mr-muted);font-weight:600;font-size:11px}
.group-head::after{content:"";order:1;flex:1;height:1px;background:var(--mr-line)}
.group-head .icon{order:2;transition:rotate .16s var(--mr-ease)}
.group-head[aria-expanded="false"] .icon{rotate:-90deg}
.group-head:hover{color:var(--mr-text)}
.group-hint{margin:2px 0 4px;color:var(--mr-muted);font-size:11px}

${controlCss}
.foot{position:relative;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px 2px;padding:10px 12px;
border-top:1px solid var(--mr-line);flex:none}
.foot .btn{height:auto;min-height:26px;max-width:100%;white-space:normal;text-align:center}
.foot .primary{margin-right:auto}
.toast{position:absolute;left:50%;bottom:calc(100% + 8px);max-width:calc(100% - 24px);padding:7px 12px;border-radius:7px;
background:var(--mr-text);color:var(--mr-bg);font-weight:500;text-align:center;pointer-events:none;
box-shadow:0 10px 28px var(--mr-shadow);opacity:0;translate:-50% 6px;transition:opacity .16s var(--mr-ease),translate .16s var(--mr-ease)}
.toast.show{opacity:1;translate:-50% 0}

.empty{display:grid;justify-items:start;gap:8px;padding:10px 2px 6px}
.empty .mark{margin-bottom:2px}
.empty-title{font-size:13px;font-weight:600}
.empty-hint{color:var(--mr-muted)}
pre{width:100%;margin:4px 0 0;padding:10px 12px;border-radius:7px;background:var(--mr-surface);box-shadow:inset 0 0 0 1px var(--mr-line);
font:11px/1.6 var(--mr-mono);color:var(--mr-text);overflow-x:auto;white-space:pre}

.modal{position:absolute;inset:0;z-index:2;display:grid;place-items:center;padding:16px;background:var(--mr-scrim)}
.modal-card{width:100%;display:grid;gap:10px;padding:14px;border-radius:12px;background:var(--mr-surface);
box-shadow:0 24px 64px var(--mr-shadow),inset 0 0 0 1px var(--mr-line)}
.modal-title{font-weight:600}
.manual-text{width:100%;min-height:128px;resize:vertical;padding:8px;border:0;border-radius:7px;background:var(--mr-bg);
box-shadow:inset 0 0 0 1px var(--mr-line);font:11px/1.5 var(--mr-mono)}
.modal .btn{justify-self:end;background:var(--mr-raise)}

.layer{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.locate{position:absolute;left:0;top:0;border:2px solid var(--mr-accent);border-radius:10px;
box-shadow:0 0 0 4px rgb(255 212 0 / .15);animation:mr-locate 1.6s var(--mr-ease) both}
.locate::before{content:"";position:absolute;left:50%;top:-8px;width:2px;height:12px;margin-left:-1px;border-radius:1px;background:var(--mr-accent)}
@keyframes mr-locate{0%{opacity:0;scale:1.08}14%{opacity:1;scale:1}78%{opacity:1}100%{opacity:0}}

@media (max-width:559.98px){
.panel{top:auto;bottom:0;width:100%;height:62vh;max-height:none;translate:none;transform-origin:50% 100%;border-radius:12px 12px 0 0}
.head{cursor:default;touch-action:auto}
.foot{padding-bottom:calc(10px + env(safe-area-inset-bottom))}
}
@media (pointer:coarse){
input,select,textarea{font-size:16px!important}
.search,.numbox,.field,input.text,select{height:32px}
.btn,.icon-btn{height:32px}
.icon-btn{width:32px}
.chip,.more-tabs,.seen-all{height:30px}
.foot .btn{min-height:32px}
.reset::after,.switch::after{content:"";position:absolute;inset:-6px}
.reset{position:relative}
.switch::after{inset:-7px}
.plot{width:120px}
.hit{r:.16px}
}
@media (prefers-reduced-motion:reduce){
.panel,.ring,.mark-turn,.switch,.knob,.toast,.group-head .icon{transition:none!important}
.ring:hover .mark-turn{transform:none}
.run{animation-play-state:paused}
.locate{animation:none}
}
`;

/** One constructed sheet shared by every shadow root; a <style> where that is unsupported. */
export function adopt(root: ShadowRoot): void {
  try {
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
    }
    root.adoptedStyleSheets = [sheet];
  } catch {
    root.append(h('style', {}, css));
  }
}
