import { useRankings } from '../data/useRankings';

export default function Footer() {
  const { data } = useRankings();
  const updated = data?.meta?.generated_at
    ? new Date(data.meta.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'recently';

  return (
    <footer className="border-t border-gold/15 py-9 mt-10 relative z-10 glass">
      <div className="max-w-[1200px] mx-auto px-7 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-display text-[24px] text-gold tracking-[0.1em]">THE CUTOFF</div>
          <div className="font-mono text-[9px] text-muted tracking-[0.2em] mt-1">DEFENSIVE ANALYTICS · EST. 2026</div>
        </div>
        <div className="font-mono text-[10px] text-muted text-right leading-relaxed tracking-[0.06em]">
          Data: Baseball Savant · Baseball Reference · FanGraphs<br />
          <span className="text-gold/80">© The Cutoff</span> · Updated {updated}
        </div>
      </div>
    </footer>
  );
}
