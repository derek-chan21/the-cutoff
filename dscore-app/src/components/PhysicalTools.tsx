import { motion } from 'motion/react';
import type { Player } from '../types';
import { Activity } from './icons';

// MLB percentile cutoffs for each tool (calibrated from Statcast historical data)
// Used to compute a "0-100" bar for each stat.
const PERCENTILE_CUTOFFS = {
  sprint_speed:    { min: 24,  max: 31 },    // 24 ft/s = slow, 30+ = elite
  hp_to_1b:        { min: 4.8, max: 4.0 },   // inverted: faster (lower seconds) is better
  pop_time_2b:     { min: 2.2, max: 1.75 },  // inverted: faster pop is better
  arm_strength_mph:{ min: 76,  max: 92 },    // 76 = below avg, 92+ = elite
  exchange_time:   { min: 0.8, max: 0.55 },  // inverted: faster exchange is better
} as const;

function pct(value: number, key: keyof typeof PERCENTILE_CUTOFFS): number {
  const { min, max } = PERCENTILE_CUTOFFS[key];
  if (!value) return 0;
  const range = max - min;
  return Math.max(0, Math.min(100, Math.round(((value - min) / range) * 100)));
}

function gradeLabel(percentile: number): string {
  if (percentile >= 90) return 'ELITE';
  if (percentile >= 70) return 'PLUS';
  if (percentile >= 40) return 'AVERAGE';
  if (percentile > 0)   return 'BELOW AVG';
  return '—';
}

export default function PhysicalTools({ player }: { player: Player }) {
  const isC = player.position === 'C';

  // Each position gets a different set of tools that matter for them
  const tools = isC
    ? [
        { label: 'POP TIME (2B)',   value: player.pop_time_2b,      unit: 's',   key: 'pop_time_2b' as const,     desc: 'Catch → release → arrival at second base.' },
        { label: 'ARM STRENGTH',    value: player.arm_strength_mph, unit: 'mph', key: 'arm_strength_mph' as const, desc: 'Max-effort throw velocity (mph).' },
        { label: 'EXCHANGE TIME',   value: player.exchange_time,    unit: 's',   key: 'exchange_time' as const,    desc: 'Time from receiving to releasing the ball.' },
      ]
    : [
        { label: 'SPRINT SPEED',    value: player.sprint_speed,     unit: ' ft/s', key: 'sprint_speed' as const,     desc: 'Top-end running speed (Statcast).' },
        { label: 'HOME → 1B TIME',  value: player.hp_to_1b,         unit: 's',     key: 'hp_to_1b' as const,         desc: 'Time from contact to first base.' },
        { label: 'BOLTS (30+ ft/s)',value: player.bolts,            unit: ' runs', key: 'sprint_speed' as const,     desc: 'Number of runs at 30+ ft/sec — pure burner indicator.' },
      ];

  // Don't show panel if all values are zero (no data)
  const hasData = tools.some((t) => t.value && t.value > 0);
  if (!hasData) return null;

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="mt-12"
    >
      <div className="font-mono text-[10px] tracking-[0.2em] text-gold uppercase mb-4 flex items-center gap-2">
        <Activity size={13} />
        Physical Tools · Statcast
      </div>
      <p className="font-serif italic text-[14px] text-text/75 mb-5 max-w-[600px]">
        The raw athletic measurements behind the D-Score — how the body that produces the defensive numbers actually moves.
      </p>

      <div className="grid md:grid-cols-3 gap-3">
        {tools.map((t, idx) => {
          const p = t.key === 'sprint_speed' && t.label.startsWith('BOLTS')
            ? Math.min(100, (Number(t.value) || 0) * 2)  // bolts: 50 bolts = 100%
            : pct(Number(t.value) || 0, t.key);
          const grade = gradeLabel(p);
          const displayValue = t.label.startsWith('BOLTS')
            ? String(t.value || 0)
            : (t.value ? Number(t.value).toFixed(t.unit === 's' || t.unit === 'mph' || t.unit.includes('ft') ? (t.unit === 's' ? 2 : 1) : 0) : '—');

          return (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="glass rounded-xl p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-40" />

              <div className="font-mono text-[9px] tracking-[0.18em] text-muted2 mb-3">{t.label}</div>

              <div className="flex items-baseline gap-2 mb-1">
                <div className="font-display text-[42px] leading-none text-cream">
                  {displayValue}
                </div>
                {t.value && t.value > 0 && (
                  <div className="font-mono text-[12px] text-muted2">{t.unit}</div>
                )}
              </div>

              {t.value && t.value > 0 && (
                <div className={`font-mono text-[9px] tracking-[0.18em] mb-3 ${
                  grade === 'ELITE' ? 'text-gold' : grade === 'PLUS' ? 'text-cream' : 'text-muted'
                }`}>
                  {grade} · {p}TH PERCENTILE
                </div>
              )}

              <div className="font-serif italic text-[12px] text-text/65 leading-snug mb-3">
                {t.desc}
              </div>

              <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${p}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.3 + idx * 0.1, ease: [0.34, 1.2, 0.64, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-rust to-gold"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
