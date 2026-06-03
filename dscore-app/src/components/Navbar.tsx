import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isAbout = pathname === '/about';

  const linkClass = (active: boolean) =>
    `relative font-mono text-[13px] tracking-[0.16em] uppercase transition-colors ${
      active ? 'text-gold' : 'text-muted2 hover:text-text'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-gold/20 bg-bg/85 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-7 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <span className="bb-ball spin w-6 h-6" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[22px] tracking-[0.1em] text-gold group-hover:text-cream transition-colors">
              THE CUTOFF
            </span>
            <span className="font-mono text-[13px] text-muted2 tracking-[0.22em] mt-[2px]">
              DEFENSIVE ANALYTICS · 2026
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className={linkClass(isHome)}>
            Rankings
            {isHome && <span className="absolute -bottom-[6px] left-0 right-0 h-[1px] bg-gold" />}
          </Link>
          <Link to="/about" className={linkClass(isAbout)}>
            About
            {isAbout && <span className="absolute -bottom-[6px] left-0 right-0 h-[1px] bg-gold" />}
          </Link>
          <span className="flex items-center gap-1.5 font-mono text-[13px] text-gold tracking-[0.2em] px-2.5 py-[5px] rounded-sm border border-gold/30 bg-gold/[0.05]">
            <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-dot" />
            LIVE
          </span>
        </div>
      </div>
    </nav>
  );
}
