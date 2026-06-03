import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from '../components/icons';
import { useRankings } from '../data/useRankings';
import type { Pos } from '../types';

// Striking B&W baseball game photo from Pexels (verified hot-link-friendly).
// Editorial, dramatic, classic — not a generic stadium snapshot.
const HERO_PHOTO = 'https://images.pexels.com/photos/37040588/pexels-photo-37040588.jpeg?auto=compress&cs=tinysrgb&w=1800';

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

  const summary = useMemo(() => {
    if (!data) return null;
    const all = ALL_POS.flatMap((p) => data.rankings[p] || []);
    const sorted = [...all].sort((a, b) => b.adj_dscore - a.adj_dscore);
    const top = sorted[0];
    return {
      total: all.length,
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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* ═══════════════════════════════════════════════════════
          EDITORIAL HERO — 2-column publication layout.
          Cream typography, photo as ONE element (not full backdrop),
          generous whitespace. WSJ / Athletic, not movie poster.
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pt-12 pb-20">
        {/* Top eyebrow rule */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-between border-y border-gold/25 py-3 mb-14 font-mono text-[10px] tracking-[0.22em] text-text/70"
        >
          <span>VOL. I · ISSUE 01</span>
          <span className="hidden md:inline">A DEFENSIVE REGISTER · 2026 MLB SEASON</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-dot" />
            UPDATED DAILY
          </span>
        </motion.div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          {/* LEFT — editorial typography */}
          <div>
            <motion.div
              initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="font-mono text-[10px] tracking-[0.3em] text-rust mb-6"
            >
              FEATURE · ANALYTICS
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.34, 1.1, 0.64, 1] }}
              className="font-serif text-[clamp(46px,6vw,82px)] leading-[1.02] tracking-[-0.01em] text-cream mb-7"
            >
              The defense<br />
              <span className="italic text-gold">that wins</span> games,<br />
              measured to <span className="italic">the run.</span>
            </motion.h1>

            <motion.p
              initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="font-body text-[16px] leading-[1.65] text-text/85 max-w-[520px] mb-3 font-light"
            >
              The D-Score is a single, position-aware number that combines every
              defensive skill — range, arm, blocking, framing, and game-calling —
              into one comparable scale.
            </motion.p>

            <motion.p
              initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="font-serif italic text-[16px] leading-[1.7] text-text/65 max-w-[520px] mb-10"
            >
              Drawn nightly from Statcast, Baseball Reference, and FanGraphs.
              Refreshed every morning of the season.
            </motion.p>

            <motion.div
              initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="flex items-center gap-5 flex-wrap"
            >
              <button
                onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-mono text-[11px] tracking-[0.18em] bg-gold text-bg hover:bg-cream transition-all"
              >
                BEGIN READING
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => pick('ALL')}
                className="font-mono text-[11px] tracking-[0.18em] text-text/70 hover:text-cream transition-colors underline underline-offset-4 decoration-gold/30 hover:decoration-gold"
              >
                OR JUMP TO LEAGUE INDEX
              </button>
            </motion.div>
          </div>

          {/* RIGHT — single editorial photograph */}
          <motion.figure
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.34, 1.05, 0.64, 1] }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-sm shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
              <img
                src={HERO_PHOTO}
                alt="Baseball, in motion"
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-rust/10 via-transparent to-gold/10 mix-blend-overlay pointer-events-none" />
            </div>
            <figcaption className="mt-4 font-serif italic text-[12px] text-text/55 leading-relaxed">
              <span className="font-mono not-italic text-[9px] tracking-[0.25em] text-rust mr-2">PHOTO·01</span>
              The game in monochrome — where defense is measured not in highlights
              but in the runs it quietly saves.
            </figcaption>
          </motion.figure>
        </div>

        {/* Editorial fact strip */}
        {summary && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.7 }}
            className="mt-20 pt-8 border-t border-gold/20 grid grid-cols-2 md:grid-cols-4 gap-y-7 gap-x-10"
          >
            <Fact label="QUALIFIED PLAYERS" value={summary.total.toString()} sub="across 8 positions" />
            <Fact label="LEAGUE LEADER" value={summary.topName} sub={`${summary.topPos} · ${summary.topTeam}`} />
            <Fact label="TOP D-SCORE" value={summary.topScore.toFixed(1)} sub="position-weighted" emphasis />
            <Fact label="DATA SOURCES" value="3" sub="Statcast · BRef · FanGraphs" />
          </motion.div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          POSITION INDEX
          ═══════════════════════════════════════════════════════ */}
      <section id="positions" className="relative max-w-[1280px] mx-auto px-7 pb-20">
        <motion.div
          initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
          className="flex items-end justify-between gap-6 mb-10 border-t border-gold/20 pt-10 flex-wrap"
        >
          <div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-rust mb-3">CHAPTER ONE</div>
            <h2 className="font-serif text-[clamp(40px,5vw,68px)] leading-[1] tracking-[-0.01em] text-cream">
              Select a <span className="italic text-gold">position</span>.
            </h2>
          </div>
          <p className="font-serif italic text-[15px] text-text/70 max-w-[360px]">
            Each position is graded on the skills that matter most to its job.
            Click a card to read the chapter.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {POSITIONS.map((p) => {
            const top = data?.rankings[p.key as Pos]?.[0];
            return (
              <motion.button
                key={p.key}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -3 }}
                onClick={() => pick(p.key)}
                className="group relative glass rounded-xl p-6 text-left overflow-hidden hover:border-gold/40 transition-all"
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
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -3 }}
            onClick={() => pick('ALL')}
            className="group col-span-2 md:col-span-4 relative glass-strong rounded-xl p-6 text-left overflow-hidden hover:border-gold/50 transition-all flex items-center justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div>
              <div className="font-mono text-[9px] tracking-[0.22em] text-gold mb-2">APPENDIX</div>
              <div className="font-serif text-[36px] leading-none text-cream group-hover:text-gold transition-colors">
                The full <span className="italic">league</span>, sortable.
              </div>
              <div className="font-serif italic text-[14px] text-text/80 mt-2">
                Every qualified defender, every metric, in one view.
              </div>
            </div>
            <ChevronRight className="text-gold group-hover:translate-x-1 transition-transform" size={24} />
          </motion.button>
        </motion.div>
      </section>
    </motion.div>
  );
}

// ── Editorial fact (a single labeled fact with a hairline) ─────────
function Fact({ label, value, sub, emphasis = false }: {
  label: string; value: string; sub: string; emphasis?: boolean;
}) {
  return (
    <div className="border-l-2 border-gold/30 pl-5">
      <div className="font-mono text-[9px] tracking-[0.22em] text-muted mb-2">{label}</div>
      <div className={`font-serif text-[26px] leading-[1.05] mb-1 truncate ${emphasis ? 'text-gold' : 'text-cream'}`}>
        {value}
      </div>
      <div className="font-serif italic text-[12px] text-text/65 leading-snug">{sub}</div>
    </div>
  );
}
