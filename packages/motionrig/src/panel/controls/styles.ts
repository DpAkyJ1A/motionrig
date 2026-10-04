// Control rows and inputs (§10.4): number, toggle, select, color, text, ease and the bezier editor.
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6.5 8 10l3.5-3.5' fill='none' stroke='%238b8b93' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export const controlCss = `.row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:10px;padding:7px 0}
.lab{display:flex;align-items:center;gap:2px;min-width:0;min-height:24px}
.label{display:flex;align-items:baseline;gap:6px;min-width:0;user-select:none;-webkit-user-select:none}
.name{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.key{font:11px/1.3 var(--mr-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.name+.key{color:var(--mr-muted)}
.changed .name,.changed .key{color:var(--mr-hi)}
.changed .name+.key{color:var(--mr-hi-soft)}
.reset{display:grid;place-items:center;width:20px;height:20px;border-radius:5px;color:var(--mr-hi);flex:none}
.reset:hover{background:rgb(var(--mr-hi-rgb) / .12)}
.val{display:flex;justify-content:flex-end;min-width:0}
.wide{grid-column:1/-1;margin-top:6px}
.wide:has(>[hidden]:only-child){display:none}
.hint{grid-column:1/-1;margin-top:4px;color:var(--mr-muted);font-size:11px}

.numbox,.field,input.text,select{height:24px;border-radius:7px;background:var(--mr-surface);box-shadow:inset 0 0 0 1px var(--mr-line);
font:11px var(--mr-mono);border:0}
.numbox{display:flex;align-items:center;gap:3px;padding:0 7px}
.num{width:7ch;padding:0;border:0;background:none;text-align:right;font:inherit;font-variant-numeric:tabular-nums}
.unit{color:var(--mr-muted)}
.numbox:focus-within,.field:focus-within,.swatch:focus-within{outline:2px solid var(--mr-hi);outline-offset:1px}
.num:focus-visible,.field input:focus-visible,.swatch input:focus-visible{outline:none}
input.text{width:100%;padding:0 8px}
input.text:focus-visible,select:focus-visible{outline-offset:1px}

.slide{position:relative;display:flex;align-items:center;height:18px;--p:0;--d:0}
.slide::before{content:"";position:absolute;top:3px;left:calc(6px + (100% - 12px) * var(--d));width:1px;height:12px;
background:var(--mr-tick);pointer-events:none}
input[type=range]{position:relative;-webkit-appearance:none;appearance:none;width:100%;height:18px;margin:0;
background:transparent;cursor:pointer;--fill:rgb(var(--mr-fg) / .55)}
.changed input[type=range]{--fill:var(--mr-hi)}
input[type=range]::-webkit-slider-runnable-track{height:2px;border-radius:1px;
background:linear-gradient(90deg,var(--fill) calc(6px + (100% - 12px) * var(--p)),rgb(var(--mr-fg) / .12) 0)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;margin-top:-5px;border-radius:50%;
border:2px solid var(--mr-hi);background:var(--mr-bg);box-shadow:0 0 0 3px var(--mr-bg);transition:scale .12s var(--mr-ease)}
input[type=range]:active::-webkit-slider-thumb{scale:1.2}
input[type=range]::-moz-range-track{height:2px;border-radius:1px;background:rgb(var(--mr-fg) / .12)}
input[type=range]::-moz-range-progress{height:2px;border-radius:1px;background:var(--fill)}
input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;border:2px solid var(--mr-hi);
background:var(--mr-bg);box-sizing:border-box;box-shadow:0 0 0 3px var(--mr-bg)}
input[type=range]:focus-visible{outline:none}
input[type=range]:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--mr-bg),0 0 0 5px var(--mr-halo)}
input[type=range]:focus-visible::-moz-range-thumb{box-shadow:0 0 0 3px var(--mr-bg),0 0 0 5px var(--mr-halo)}

.switch{position:relative;width:30px;height:18px;border-radius:9px;background:var(--mr-raise);
box-shadow:inset 0 0 0 1px rgb(var(--mr-fg) / .1);transition:background .16s var(--mr-ease)}
.switch .knob{position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:var(--mr-muted);
transition:translate .16s var(--mr-ease),background .16s}
.switch[aria-checked="true"]{background:var(--mr-text)}
.switch[aria-checked="true"] .knob{translate:12px 0;background:var(--mr-bg)}
.changed .switch[aria-checked="true"]{background:var(--mr-accent);box-shadow:inset 0 0 0 1px var(--mr-dot-edge)}
.changed .switch[aria-checked="true"] .knob{background:var(--mr-ink)}

select{-webkit-appearance:none;appearance:none;max-width:170px;min-width:0;padding:0 24px 0 8px;cursor:pointer;
text-overflow:ellipsis;background:var(--mr-surface) ${CHEVRON} no-repeat right 7px center}
option,optgroup{background:var(--mr-bg);color:var(--mr-text)}
.color{display:flex;align-items:center;gap:6px}
.color input.text{width:144px}
.swatch{position:relative;width:24px;height:24px;border-radius:7px;flex:none;overflow:hidden;cursor:pointer;
background:linear-gradient(var(--c),var(--c)),repeating-conic-gradient(var(--mr-check-a) 0 25%,var(--mr-check-b) 0 50%) 0 0/8px 8px;
box-shadow:inset 0 0 0 1px rgb(var(--mr-fg) / .16)}
.swatch input{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;opacity:0;cursor:pointer}
.swatch input:disabled{cursor:default}

.ease{display:flex;align-items:center;gap:8px;min-width:0}
.ease select{max-width:148px}
.thumb{width:24px;height:18px;flex:none;overflow:visible}
.thumb path{fill:none;stroke:var(--mr-muted);stroke-width:1.5;stroke-linecap:round;vector-effect:non-scaling-stroke}
.changed .thumb path{stroke:var(--mr-hi)}
.bezier{display:flex;gap:12px;padding:10px;border-radius:7px;background:var(--mr-surface);box-shadow:inset 0 0 0 1px var(--mr-line)}
.plot{width:96px;height:auto;flex:none;overflow:visible;touch-action:none}
.plot *{vector-effect:non-scaling-stroke}
.rail{fill:none;stroke:rgb(var(--mr-fg) / .07);stroke-width:1;stroke-dasharray:2 3}
.box{fill:var(--mr-bg);stroke:rgb(var(--mr-fg) / .1);stroke-width:1}
.diag{stroke:rgb(var(--mr-fg) / .14);stroke-width:1;stroke-dasharray:2 3}
.arm{stroke:var(--mr-arm);stroke-width:1}
.curve{fill:none;stroke:var(--mr-text);stroke-width:2;stroke-linecap:round}
.end{fill:var(--mr-muted)}
.handle{cursor:grab;outline:none}
.handle:active{cursor:grabbing}
.hit{fill:transparent}
.handle .knob{fill:var(--mr-surface);stroke:var(--mr-hi);stroke-width:2}
.handle:hover .knob{fill:var(--mr-accent)}
.handle:focus-visible .knob{fill:var(--mr-knob-focus)}
.handle:focus-visible .hit{fill:rgb(var(--mr-hi-rgb) / .18)}
.bz-side{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:8px}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.field{display:flex;align-items:center;gap:6px;padding:0 7px;background:var(--mr-bg);cursor:text}
.field span{color:var(--mr-muted)}
.field input{width:100%;min-width:0;padding:0;border:0;background:none;text-align:right;font:inherit}
.preview{position:relative;height:28px;border-radius:7px;background:var(--mr-bg);box-shadow:inset 0 0 0 1px var(--mr-line);overflow:hidden}
.preview::before{content:"";position:absolute;left:10px;right:10px;top:50%;height:1px;background:rgb(var(--mr-fg) / .07)}
.run{position:absolute;inset:0 18px 0 10px;animation:mr-run 1.8s infinite}
.run::after{content:"";position:absolute;left:0;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%}
.linear{animation-timing-function:linear}
.linear::after{background:rgb(var(--mr-fg) / .16)}
.eased{animation-timing-function:var(--curve,ease)}
.eased::after{background:var(--mr-bg);box-shadow:0 0 0 2px var(--mr-hi)}
.bz-params{position:relative;display:flex}
.bz-params input{width:100%;padding:0 28px 0 8px;background:var(--mr-bg);white-space:nowrap;text-overflow:ellipsis}
.bz-params input[aria-invalid]{box-shadow:inset 0 0 0 1px var(--mr-red)}
.bz-copy{position:absolute;right:2px;top:50%;translate:0 -50%;display:grid;place-items:center;width:20px;height:20px;border-radius:5px;color:var(--mr-muted)}
.bz-copy:hover{background:var(--mr-raise);color:var(--mr-text)}
@keyframes mr-run{0%,14%{transform:translateX(0)}74%,100%{transform:translateX(100%)}}
`;
