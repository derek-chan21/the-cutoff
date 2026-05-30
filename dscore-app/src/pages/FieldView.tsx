import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from '../components/icons';
import { useRankings } from '../data/useRankings';
import type { Pos } from '../types';

// Neutral aerial shot of a baseball diamond — no specific team, no recognizable stadium.
// Drone view, lush green grass + crisp white lines. Looks "MLB" without picking sides.
const BASEBALL_STADIUM = 'https://images.pexels.com/photos/5110704/pexels-photo-5110704.jpeg?auto=compress&cs=tinysrgb&w=2400';

const POSITIONS: { key: Pos | 'ALL'; label: string; full: string; group: string }[] = [
  { key: 'CF',  label: 'CF',  full: 'Center Field',  group: 'OUTFIELD' },
  { key: 'LF',  label: 'LF',  full: 'Left Field',    group: 'OUTFIELD' },
  { key: 'RF',  label: 'RF',  full: 'Right Field',   group: 'OUTFIELD' },
  { key: 'SS',  label: 'SS',  full: 'Shortstop',     group: 'INFIELD' },
  { key: '2B',  label: '2B',  full: 'Second Base',   group: 'INFIELD' },
  { key: '3B',  label: '3B',  full: 'Third Base',    group: 'INFIELD' },
  { key: '1B',  label: '1B',  full: 'First Base',    group: 'INFIELD' },
  { key: 'C',   label: 'C',   full: 'Catcher',       group: 'BATTERY' },
];

const ALL_POS: Pos[] = ['CF', 'SS', 'C', '2B', '3B', 'RF', 'LF', '1B'];

export default function FieldView() {
  const navigate = useNavigate();
  const { data } = useRankings();
  const pick = (pos: Pos | 'ALL') => navigate(`/rankings/${pos}`);

  // Stats summary: total qualified players, top D-Score, leader name
  const summary = useMemo(() => {
    if (!data) return null;
    const all = ALL_POS.flatMap((p) => data.rankings[p] || []);
    const sorted = [...all].sort((a, b) => b.adj_dscore - a.adj_dscore);
    const top = sorted[0];
    return {
      total: all.length,
      catchers: data.rankings.C?.length || 0,
      outfielders: (data.rankings.CF?.length || 0) + (data.rankings.LF?.length || 0) + (data.rankings.RF?.length || 0),
      infielders: (data.rankings.SS?.length || 0) + (data.rankings['2B']?.length || 0) + (data.rankings['3B']?.length || 0) + (data.rankings['1B']?.length || 0),
      topScore: top?.adj_dscore || 0,
      topName: top ? top.player.split(',').reverse().join(' ').trim() : '—',
      topPos: top?.position || '',
      topTeam: top?.team || '',
    };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* ═══════════════════════════════════════════════════════
          POSTER HERO — editorial / magazine, no neon
          ═══════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 'calc(100vh - 65px)' }}>
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 z-0"
        >
          <motion.img
            src={BASEBALL_STADIUM}
            alt=""
            className="w-full h-full object-cover"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 26, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
          {/* Warm dramatic gradient — no harsh blue tint anymore */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/55 via-bg/15 to-bg/55" />
          <div className="absolute inset-0 bg-bg/30" />
        </motion.div>

        {/* Foreground */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-7 py-10 min-h-[calc(100vh-65px)] flex flex-col">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-12">
            <motion.div
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-2"
            >
              {['OAA', 'DRS', 'FRAMING', 'ARM VALUE'].map((g) => (
                <span key={g} className="font-mono text-[9px] tracking-[0.22em] glass px-3 py-1.5 rounded-full text-text/85">
                  {g}
                </span>
              ))}
            </motion.div>
            <motion.div
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-mono text-[10px] tracking-[0.25em] text-gold flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-dot" />
              ISSUE NO. 01 · APRIL 2026
            </motion.div>
          </div>

          {/* Giant headline */}
          <div className="flex-1 flex flex-col items-center justify-center text-center my-4">
            <motion.div
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-mono text-[12px] tracking-[0.5em] text-text/55 mb-2"
            >
              THE
            </motion.div>

            <motion.h1
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.34, 1.1, 0.64, 1] }}
              className="font-display tracking-[0.01em] leading-[0.85] relative"
              style={{ fontSize: 'clamp(110px, 22vw, 340px)' }}
            >
              <span className="block text-cream" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}>
                CUTOFF
              </span>
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 1 }}
              style={{ originX: 0.5 }}
              className="h-px w-[60%] max-w-[500px] bg-gradient-to-r from-transparent via-gold to-transparent my-4"
            />

            <motion.div
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="font-serif italic text-[clamp(18px,2.6vw,28px)] text-cream/90"
            >
              The Defensive Annual · <span className="text-gold">2026 Edition</span>
            </motion.div>
          </div>

          {/* SUMMARY PANEL — replaces blank space, 4 quick facts */}
          {summary && (
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 mb-8"
            >
              <SummaryCard label="QUALIFIED PLAYERS" value={summary.total.toString()} sub="across all positions" />
              <SummaryCard label="LEAGUE LEADER" value={summary.topName} sub={`${summary.topPos} · ${summary.topTeam}`} />
              <SummaryCard label="HIGHEST D-SCORE" value={summary.topScore.toFixed(1)} sub="adjusted, position-weighted" highlight />
              <SummaryCard label="POSITIONS COVERED" value="8" sub={`${summary.outfielders} OF · ${summary.infielders} IF · ${summary.catchers} C`} />
            </motion.div>
          )}

          {/* Bottom row: synopsis + CTA */}
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end mt-auto pt-6 border-t border-gold/15">
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="max-w-[560px]"
            >
              <div className="font-mono text-[10px] text-gold/80 tracking-[0.22em] mb-2">FROM THE EDITORS</div>
              <p className="font-serif italic text-[15px] leading-relaxed text-text/95 font-light">
                A complete defensive register of the 2026 MLB season. Range, arm, blocking,
                framing, and game-calling — every defensive skill, isolated and weighted by
                position. Updated daily from Statcast, Baseball Reference, and FanGraphs.
              </p>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-3 px-7 py-4 rounded-full font-mono text-[11px] tracking-[0.2em] bg-gold text-bg hover:bg-cream transition-colors"
            >
              ENTER THE INDEX
              <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          POSITION INDEX — clean magazine-style grid
          ═══════════════════════════════════════════════════════ */}
      <section id="positions" className="relative max-w-[1200px] mx-auto px-7 py-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="font-mono text-[10px] tracking-[0.25em] text-gold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            CHAPTER ONE · THE INDEX
          </div>
          <h2 className="font-display text-[clamp(40px,7vw,80px)] leading-[0.95] mb-3">
            <span className="text-cream">SELECT A</span>{' '}
            <span className="text-gold">POSITION</span>
          </h2>
          <p className="font-serif italic text-[16px] text-text/80 max-w-[520px] font-light">
            Each position has its own formula. Click a card to read the chapter.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {POSITIONS.map((p) => {
            const top = data?.rankings[p.key as Pos]?.[0];
            return (
              <motion.button
                key={p.key}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
                onClick={() => pick(p.key)}
                className="group relative glass rounded-2xl p-6 text-left overflow-hidden hover:border-gold/40 transition-all"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-40 group-hover:opacity-80 transition-opacity" />
                <div className="font-mono text-[9px] tracking-[0.22em] text-muted mb-3">{p.group}</div>
                <div className="font-display text-[64px] leading-none text-cream mb-2 group-hover:text-gold transition-colors">
                  {p.label}
                </div>
                <div className="font-serif italic text-[14px] text-text/80 mb-4">{p.full}</div>
                {top && (
                  <div className="pt-3 border-t border-gold/15">
                    <div className="font-mono text-[8px] text-muted tracking-[0.18em] mb-1">LEADER</div>
                    <div className="font-body text-[12px] text-text/90 truncate">
                      {top.player.split(',').reverse().join(' ').trim()}
                    </div>
                    <div className="font-mono text-[10px] text-gold mt-1">{top.adj_dscore} D-SCORE</div>
                  </div>
                )}
                <ChevronRight className="absolute bottom-5 right-5 text-gold/40 group-hover:text-gold group-hover:translate-x-1 transition-all" size={16} />
              </motion.button>
            );
          })}

          <motion.button
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -4 }}
            onClick={() => pick('ALL')}
            className="group col-span-2 md:col-span-4 relative glass-strong rounded-2xl p-6 text-left overflow-hidden hover:border-gold/50 transition-all flex items-center justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div>
              <div className="font-mono text-[9px] tracking-[0.22em] text-gold mb-2">APPENDIX · FULL LEAGUE</div>
              <div className="font-display text-[40px] leading-none text-cream group-hover:text-gold transition-colors">
                ALL POSITIONS COMBINED
              </div>
              <div className="font-serif italic text-[14px] text-text/80 mt-2">
                Every qualified defender in the league, sortable by any metric.
              </div>
            </div>
            <ChevronRight className="text-gold group-hover:translate-x-1 transition-transform" size={24} />
          </motion.button>
        </motion.div>
      </section>
    </motion.div>
  );
}

// ── Editorial summary card ──────────────────────────────────
function SummaryCard({ label, value, sub, highlight = false }: {
  label: string; value: string; sub: string; highlight?: boolean;
}) {
  return (
    <div className={`glass rounded-xl px-5 py-4 ${highlight ? 'border-gold/30' : ''}`}>
      <div className="font-mono text-[9px] tracking-[0.22em] text-muted mb-1.5">{label}</div>
      <div className={`font-display text-[28px] leading-none mb-1 ${highlight ? 'text-gold' : 'text-cream'} truncate`}>
        {value}
      </div>
      <div className="font-mono text-[9px] text-muted2 tracking-wider truncate">{sub}</div>
    </div>
  );
}
