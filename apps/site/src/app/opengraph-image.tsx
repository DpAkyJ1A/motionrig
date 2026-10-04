import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'motionrig: Devs rig it. Designers play it. A yellow control ring on a 3D viewport floor.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Static instances of the site's fonts: Satori reads TTF, not the variable WOFF2 next/font serves.
const fonts = join(process.cwd(), 'assets/fonts');
const display = await readFile(join(fonts, 'Anybody-SemiExpanded-ExtraBold.ttf'));
const mono = await readFile(join(fonts, 'MartianMono-SemiCondensed-Medium.ttf'));

const RIG = '#ffd400';
const W = size.width;
const H = size.height;

/** The ring sits on the floor below the headline: centre, radii of the squashed circle. */
const RING = { x: 600, y: 505, rx: 560, ry: 92 };
const HORIZON = 400;

/** Floor lines: rays from a vanishing point, and depth lines that spread toward the viewer. */
const rays = Array.from({ length: 25 }, (_, i) => (i - 12) * 150);
const depths = Array.from({ length: 7 }, (_, i) => HORIZON + 6 * (i + 1) ** 2.1);

function Ring({ size: px }: { size: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13.5" r="7.5" stroke={RIG} strokeWidth="2.4" />
      <path d="M12 6V1.5" stroke={RIG} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="13.5" r="2.25" fill={RIG} />
    </svg>
  );
}

export default function Image() {
  const { x, y, rx, ry } = RING;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '52px 72px',
        color: '#eeeef0',
        fontFamily: 'Martian Mono',
        backgroundColor: '#17191c',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0 }}>
        {rays.map((dx) => (
          <line key={dx} x1={x} y1={HORIZON} x2={x + dx * 4} y2={H + HORIZON} stroke="#ffffff" strokeOpacity="0.07" />
        ))}
        {depths.map((dy) => (
          <line key={dy} x1="0" y1={dy} x2={W} y2={dy} stroke="#ffffff" strokeOpacity="0.07" />
        ))}
        <line x1="40" y1={y} x2={W - 40} y2={y} stroke="#ff4d3d" strokeOpacity="0.7" strokeWidth="2" />
        <line x1={x} y1={y - 130} x2={x} y2={H} stroke="#3d9bff" strokeOpacity="0.7" strokeWidth="2" />
        {/* Far half fainter, near half full: a floor circle seen from above. */}
        <path d={`M${x - rx} ${y} A${rx} ${ry} 0 0 1 ${x + rx} ${y}`} stroke={RIG} strokeOpacity="0.3" strokeWidth="3" fill="none" />
        <path d={`M${x - rx} ${y} A${rx} ${ry} 0 0 0 ${x + rx} ${y}`} stroke={RIG} strokeWidth="3" fill="none" />
        <line x1={x} y1={y - ry} x2={x} y2={y - ry - 26} stroke={RIG} strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx={x} cy={y} rx="8" ry="4" fill={RIG} />
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28 }}>
          <Ring size={36} />
          motionrig
        </div>
        <div
          style={{
            display: 'flex',
            padding: '8px 18px',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 999,
            fontSize: 18,
            color: '#9b9da6',
          }}
        >
          v0.1 · npm soon
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 64,
          fontFamily: 'Anybody',
          fontSize: 92,
          lineHeight: 1,
          letterSpacing: '-0.035em',
          whiteSpace: 'nowrap',
        }}
      >
        <span>Devs rig it.</span>
        <span>Designers play it.</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Anybody', data: display, weight: 800, style: 'normal' },
        { name: 'Martian Mono', data: mono, weight: 500, style: 'normal' },
      ],
    },
  );
}
