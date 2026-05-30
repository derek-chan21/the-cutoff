// Inline SVG icons — drop-in replacements for lucide-react.
// Avoids the React 19 compatibility issue with the lucide-react package.

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 24): SVGProps<SVGSVGElement> => ({
  xmlns: 'http://www.w3.org/2000/svg',
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export function ChevronRight({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ArrowLeft({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export function MousePointerClick({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M9 9l3 11 2-6 6-2L9 9z" />
      <path d="M7 2v2" />
      <path d="M2 7h2" />
      <path d="M5 5l1.5 1.5" />
    </svg>
  );
}

export function MapPin({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function Trophy({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export function Target({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function Shield({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function Activity({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.5.5 0 0 1-.96 0L9.24 3.18a.5.5 0 0 0-.96 0l-2.35 8.36A2 2 0 0 1 4 13H2" />
    </svg>
  );
}
