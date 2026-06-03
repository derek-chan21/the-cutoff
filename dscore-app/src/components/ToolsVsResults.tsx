import { motion } from 'motion/react';
import type { Player } from '../types';
import { Activity } from './icons';

// Visualizes the prediction model: predicted D-Score from physical tools
// alone vs. the player's actual D-Score. The gap tells the story —
// positive means they're doing more with their athletic measurements
// than the model expects (instincts, positioning, IQ). Negative means
// the tools are there but the production isn't (yet).

export default function ToolsVsResults({ player }: { player: Player }) {
  const actual = player.adj_dscore;
  const predicted = player.predicted_dscore;
  const gap = player.dscore_gap;

  // Skip if no prediction data
  if (predicted === undefined || gap === undefined || predicted === 0) return null;

  const isOver = gap > 2;
  const isUnder = gap < -2;
  const isNeutral = !isOver && !isUnder;

  const verdict = isOver ? 'OUTPERFORMS TOOLS' : isUnder ? 'TRAILS TOOLS' : 'MEETS TOOLS';
  const verdictTint = isOver ? 'text-gold' : isUnder ? 'text-rust' : 'text-cream';

  // Narrative copy based on category
  const narrative = isOver
    ? `Plays bigger than his measurements would suggest. The ${Math.abs(gap).toFixed(1)}-point premium points to instincts, positioning, and route-running that the raw athletic profile doesn't capture.`
    : isUnder
    ? `Tools say elite, results say not yet. A ${Math.abs(gap).toFixed(1)}-point shortfall — either the technique hasn't caught up to the athleticism, or it's an early-season sample doing the talking.`
    : `The tools and the results agree. What you see on the radar gun is what you get in the runs-saved column.`;

  // Bar positions on a -30 to +30 scale, capped
  const cap = 30;
  const gapPct = Math.max(-1, Math.min(1, gap / cap));
  const markerLeft = 50 + gapPct * 50; // % from left, 50 = neutral

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="mt-12"
    >
      <div className="font-mono text-[12px] tracking-[0.2em] text-gold uppercase mb-4 flex items-center gap-2">
        <Activity size={13} />
        Tools vs Results · Prediction Model
      </div>

      <p className="font-serif italic text-[15px] text-text/75 mb-6 max-w-[640px]">
        What D-Score would the physical tools alone — sprint speed, arm
        strength, pop time, jump — predict for a player at this position?
        And how far does the actual D-Score lie from that prediction?
      </p>

      <div className="glass-strong rounded-2xl p-6 md:p-8">
        {/* Verdict header */}
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
          <div className={`font-mono text-[13px] tracking-[0.22em] ${verdictTint}`}>
            {verdict}
          </div>
          <div className={`font-display text-[36px] leading-none ${isOver ? 'text-gold' : isUnder ? 'text-rust' : 'text-cream'}`}>
            {gap > 0 ? '+' : ''}{gap.toFixed(1)}
          </div>
        </div>

        {/* The bar — gap visualized */}
        <div className="relative h-1.5 bg-text/8 rounded-full overflow-visible mb-1">
          {/* Center marker */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-3 bg-text/40" />
          {/* Player marker */}
          <motion.div
            initial={{ left: '50%', opacity: 0 }}
            whileInView={{ left: `${markerLeft}%`, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${isOver ? 'bg-gold' : isUnder ? 'bg-rust' : 'bg-cream'} shadow-lg`}
            style={{ boxShadow: `0 0 0 4px ${isOver ? 'rgba(198,151,73,0.18)' : isUnder ? 'rgba(194,93,63,0.18)' : 'rgba(240,231,210,0.18)'}` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[11px] text-muted2 mt-3 mb-7">
          <span>TRAILS TOOLS</span>
          <span>MEETS TOOLS</span>
          <span>OUTPERFORMS</span>
        </div>

        {/* The two numbers, side by side */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="border-l-2 border-text/15 pl-4">
            <div className="font-mono text-[11px] tracking-[0.18em] text-muted2 mb-1">EXPECTED FROM TOOLS</div>
            <div className="font-display text-[44px] leading-none text-cream">
              {predicted.toFixed(1)}
            </div>
            <div className="font-mono text-[11px] text-muted2 mt-1">model prediction</div>
          </div>
          <div className={`border-l-2 pl-4 ${isOver ? 'border-gold' : isUnder ? 'border-rust' : 'border-cream/30'}`}>
            <div className="font-mono text-[11px] tracking-[0.18em] text-muted2 mb-1">ACTUAL D-SCORE</div>
            <div className={`font-display text-[44px] leading-none ${isOver ? 'text-gold' : isUnder ? 'text-rust' : 'text-cream'}`}>
              {actual.toFixed(1)}
            </div>
            <div className="font-mono text-[11px] text-muted2 mt-1">{isNeutral ? 'in line' : `${Math.abs(gap).toFixed(1)} ${isOver ? 'over' : 'under'}`}</div>
          </div>
        </div>

        {/* Narrative */}
        <p className="font-serif italic text-[15px] leading-relaxed text-text/85 max-w-[680px] mt-5">
          {narrative}
        </p>

        <div className="mt-6 pt-5 border-t border-text/10 font-mono text-[11px] text-muted tracking-wide leading-relaxed">
          Inputs: sprint speed, home-to-first time, bolts, pop time, arm
          strength, exchange time, outfield jump (reaction · burst · route),
          innings, position. Trained out-of-fold so each player's prediction
          comes from a model that didn't see them.
        </div>
      </div>
    </motion.div>
  );
}
