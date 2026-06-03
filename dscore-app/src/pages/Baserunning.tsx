import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Trophy, Target, Shield } from '../components/icons';
import { useRankings } from '../data/useRankings';
import { getTeam } from '../data/teams';
import type { Baserunner } from '../types';
import BaseballLoader from '../components/BaseballLoader';

// CHAPTER TWO — Baserunning. Mirrors the defensive section in tone and
// rhythm. Layout:
//   1. Editorial hero
//   2. LEADERS BY CATEGORY  (top 5 in each individual stat)
//   3. TOOLS vs RESULTS     (prediction model: smart vs raw speed)
//   4. Methodology explainer
//   5. Full leaderboard (top 50 by B-Score)

export default function Baserunning() {
  const { data, error } = useRankings();
  const runners = data?.baserunning_rankings || [];

  // ── Aggregate impact + per-stat leaders ─────────────────────
  const sections = useMemo(() => {
    if (!runners.length) return null;
    const sortBy = (key: keyof Baserunner, asc = false) =>
      [...runners].sort((a, b) => asc
        ? (a[key] as number) - (b[key] as number)
        : (b[key] as number) - (a[key] as number)
      );
    return {
      total: runners.length,
      top: runners[0],
      top25Runs: runners.slice(0, 25).reduce((s, p) => s + p.wbsr, 0).toFixed(1),
      top25SB: runners.slice(0, 25).reduce((s, p) => s + p.sb, 0),
      // Per-category leaderboards
      byWBSR: sortBy('wbsr').slice(0, 5),
      bySB:   sortBy('sb').slice(0, 5),
      bySuccess: sortBy('sb_success').filter(p => (p.sb + p.cs) >= 5).slice(0, 5), // min 5 attempts
      bySpd:  sortBy('spd').slice(0, 5),
      bySprint: sortBy('sprint_speed').slice(0, 5),
      // Prediction-model leaders/laggards
      overperformers:  sortBy('bscore_gap' as keyof Baserunner).slice(0, 5),
      underperformers: sortBy('bscore_gap' as keyof Baserunner, true).slice(0, 5),
    };
  }, [runners]);

  if (error) return (
    <div className="max-w-[1100px] mx-auto px-7 py-16">
      <div className="glass border border-rust/30 rounded-xl p-6 font-mono text-[14px] text-rust">
        Could not load data: {error}
      </div>
    </div>
  );
  if (!data) return <BaseballLoader />;
  if (!sections) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative max-w-[1280px] mx-auto px-7 pt-12 pb-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[13px] text-gold tracking-[0.18em] hover:-translate-x-1 transition-all mb-8 no-underline"
        >
          <ArrowLeft size={12} />
          BACK TO THE INDEX
        </Link>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-between border-y border-gold/25 py-3 mb-12 font-mono text-[13px] tracking-[0.22em] text-text/70"
        >
          <span>CHAPTER TWO</span>
          <span className="hidden md:inline">BASERUNNING · THE B-SCORE INDEX</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-dot" />
            UPDATED DAILY
          </span>
        </motion.div>

        <div className="max-w-[920px]">
          <motion.div
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-mono text-[13px] tracking-[0.3em] text-rust mb-6"
          >
            FEATURE · BASERUNNING
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.34, 1.1, 0.64, 1] }}
            className="font-serif text-[clamp(46px,6.5vw,88px)] leading-[1.02] tracking-[-0.01em] text-cream mb-7"
          >
            The Cutoff,<br />
            <span className="italic text-gold">quite literally.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="font-serif italic text-[20px] leading-[1.55] text-text/85 mb-7 max-w-[680px]"
          >
            Defense's quiet sibling. The best baserunners can be worth
            ten runs over a season — and almost none of it shows up on a highlight reel.
          </motion.p>
          <motion.p
            initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="font-body text-[16px] leading-[1.7] text-text/85 max-w-[680px] mb-10"
          >
            They take the extra base. They steal at a 75%+ clip. They turn a
            single into a double on a routine flyout. They almost never get
            picked off. This chapter is their record.
          </motion.p>
        </div>

        {/* Impact strip */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mt-10 pt-8 border-t border-gold/20 grid grid-cols-2 md:grid-cols-4 gap-y-7 gap-x-10"
        >
          <Fact label="QUALIFIED RUNNERS" value={sections.total.toString()} sub="50+ plate appearances" />
          <Fact label="LEAGUE LEADER" value={sections.top.player.split(',').reverse().join(' ').trim()} sub={`${sections.top.team}`} />
          <Fact label="TOP B-SCORE" value={sections.top.b_score.toFixed(1)} sub="weighted composite" emphasis />
          <Fact label="TOP-25 IMPACT" value={`+${sections.top25Runs}`} sub={`runs · ${sections.top25SB} steals combined`} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LEADERS BY CATEGORY — almanac-style grid
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pb-12">
        <motion.div
          initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
          className="border-t border-gold/20 pt-10 mb-7"
        >
          <div className="font-mono text-[13px] tracking-[0.25em] text-rust mb-3 flex items-center gap-2">
            <Trophy size={14} className="text-gold" />
            SECTION I · LEADERS BY CATEGORY
          </div>
          <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1] tracking-[-0.01em] text-cream mb-2">
            Five leaders, <span className="italic text-gold">five categories.</span>
          </h2>
          <p className="font-serif italic text-[15px] text-text/70 max-w-[600px]">
            Each statistic measures a different shade of baserunning.
            Here are the best in each.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <LeaderCard
            title="BASES EARNED"
            metric="wBsR"
            description="Weighted base running runs — the headline number."
            runners={sections.byWBSR}
            valueOf={p => (p.wbsr >= 0 ? '+' : '') + p.wbsr.toFixed(2)}
          />
          <LeaderCard
            title="STOLEN BASES"
            metric="SB"
            description="Raw steals — pure aggression on the basepaths."
            runners={sections.bySB}
            valueOf={p => p.sb.toString()}
          />
          <LeaderCard
            title="STEAL SUCCESS"
            metric="SB%"
            description="Stolen-base success rate (min 5 attempts)."
            runners={sections.bySuccess}
            valueOf={p => `${p.sb_success.toFixed(1)}%`}
          />
          <LeaderCard
            title="SPEED SCORE"
            metric="SPD"
            description="Bill James composite — running ability."
            runners={sections.bySpd}
            valueOf={p => p.spd.toFixed(1)}
          />
          <LeaderCard
            title="SPRINT SPEED"
            metric="ft/sec"
            description="Statcast top-end speed. The raw athletic ceiling."
            runners={sections.bySprint}
            valueOf={p => p.sprint_speed.toFixed(1)}
          />
          <LeaderCard
            title="B-SCORE"
            metric="0–99"
            description="The composite — wBsR + success + speed combined."
            runners={runners.slice(0, 5)}
            valueOf={p => p.b_score.toFixed(1)}
            emphasis
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TOOLS vs RESULTS — prediction model
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pb-12">
        <motion.div
          initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
          className="border-t border-gold/20 pt-10 mb-7"
        >
          <div className="font-mono text-[13px] tracking-[0.25em] text-rust mb-3 flex items-center gap-2">
            <Activity size={14} className="text-gold" />
            SECTION II · TOOLS VS RESULTS
          </div>
          <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1] tracking-[-0.01em] text-cream mb-2">
            Speed isn't <span className="italic text-gold">everything.</span>
          </h2>
          <p className="font-serif italic text-[15px] text-text/75 max-w-[700px]">
            Sprint speed alone explains about half of baserunning value. The other half
            is reads, jumps, decisions. The model below predicts each runner's B-Score
            from their raw tools (sprint speed, steal attempts, exposure). The gap from
            actual B-Score tells the rest of the story.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Overperformers */}
          <PredictionPanel
            title="THE SMART ONES"
            kicker="OUTPERFORMS HIS TOOLS"
            description="Modest raw speed, elite results. Reads pitchers, gets great jumps, almost never wastes an out."
            tint="gold"
            runners={sections.overperformers}
          />
          {/* Underperformers */}
          <PredictionPanel
            title="THE WASTED WHEELS"
            kicker="TRAILS HIS TOOLS"
            description="Sprint speed says elite, the production hasn't followed. Either rarely runs, bad reads, or both."
            tint="rust"
            runners={sections.underperformers}
          />
        </div>

        <p className="font-mono text-[12px] text-text/55 italic mt-5 max-w-[800px]">
          Model: Ridge regression on sprint speed, attempt rate, and plate appearances.
          Trained out-of-fold (5-fold CV) so every prediction comes from a model that
          didn't see that player. Correlation with actual B-Score: ≈ 0.70.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════
          METHODOLOGY — how the B-Score is built
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pb-12">
        <motion.div
          initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
          className="border-t border-gold/20 pt-10"
        >
          <div className="font-mono text-[13px] tracking-[0.25em] text-rust mb-3 flex items-center gap-2">
            <Shield size={14} className="text-gold" />
            SECTION III · METHODOLOGY
          </div>
          <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1] tracking-[-0.01em] text-cream mb-3">
            How the <span className="italic text-gold">B-Score</span> is built.
          </h2>
          <p className="font-serif italic text-[16px] text-text/80 max-w-[680px] mb-5">
            One composite score, 0-to-99 scale, built from three public inputs.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            <Input label="wBsR" source="FanGraphs" desc="Weighted Base Running runs — the headline metric. Every taken base, every advance on a flyout, every smart read converted into runs vs. an average baserunner." />
            <Input label="STOLEN BASE SUCCESS" source="MLB" desc="Stolen base success rate with a small 3-attempt prior so a 3-for-3 fluke doesn't crown someone at 100%. Break-even is ~75 percent." />
            <Input label="SPEED SCORE" source="FanGraphs" desc="Bill James's classic Spd composite — raw running ability drawn from steals, triples, runs scored per time on base, and similar signals." />
          </div>
          <p className="font-mono text-[12px] text-text/55 italic mt-5 max-w-[680px]">
            The exact weights are kept private — same policy as the D-Score.
            What they're applied to is everything above.
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FULL LEADERBOARD — top 50 by B-Score
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pb-20">
        <motion.div
          initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
          className="border-t border-gold/20 pt-10"
        >
          <div className="flex items-end justify-between gap-6 mb-7 flex-wrap">
            <div>
              <div className="font-mono text-[13px] tracking-[0.25em] text-rust mb-3 flex items-center gap-2">
                <Target size={14} className="text-gold" />
                APPENDIX · FULL LEADERBOARD
              </div>
              <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1] tracking-[-0.01em] text-cream">
                The top fifty, <span className="italic text-gold">in order.</span>
              </h2>
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <Th className="text-left w-[50px]">#</Th>
                  <Th className="text-left">Player</Th>
                  <Th className="text-left">Team</Th>
                  <Th>wBsR</Th>
                  <Th>SB</Th>
                  <Th>CS</Th>
                  <Th>SB%</Th>
                  <Th>SPD</Th>
                  <Th>SPRINT</Th>
                  <Th>B-SCORE</Th>
                </tr>
              </thead>
              <tbody>
                {runners.slice(0, 50).map((p, i) => {
                  const team = getTeam(p.team);
                  const initial = (p.player.split(',')[0] || '?').charAt(0).toUpperCase();
                  return (
                    <motion.tr
                      key={`${p.player}-${p.rank}`}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(i * 0.02, 0.5), duration: 0.35 }}
                      onClick={() => window.location.assign(`/baserunner/${p.rank}`)}
                      className={`border-b border-white/[0.05] hover:bg-gold/[0.04] transition-colors cursor-pointer ${
                        i === 0 ? 'bg-gold/[0.05]' : ''
                      }`}
                      style={i === 0 ? { borderLeft: `2px solid ${team.primary}` } : {}}
                    >
                      <td className="px-3 py-3 text-center font-mono text-[13px] text-muted">
                        {i === 0 ? <span className="text-gold font-semibold">#1</span> : `#${i + 1}`}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {p.headshot ? (
                            <img src={p.headshot} alt="" className="w-[36px] h-[36px] rounded-full object-cover border border-white/[0.08] bg-surface flex-shrink-0" />
                          ) : (
                            <div className="w-[36px] h-[36px] rounded-full glass flex items-center justify-center font-mono text-[13px] text-muted flex-shrink-0">{initial}</div>
                          )}
                          <span className="font-body text-[14px] text-text">{p.player}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-[13px] text-muted2">{p.team || '—'}</td>
                      <Td>{(p.wbsr >= 0 ? '+' : '') + p.wbsr.toFixed(2)}</Td>
                      <Td>{p.sb}</Td>
                      <Td muted>{p.cs}</Td>
                      <Td>{p.sb_success.toFixed(1)}%</Td>
                      <Td muted>{p.spd.toFixed(1)}</Td>
                      <Td muted>{p.sprint_speed > 0 ? p.sprint_speed.toFixed(1) : '—'}</Td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-display text-[26px] ${
                          p.b_score >= 80 ? 'text-gold' : p.b_score >= 60 ? 'text-cream' : 'text-muted2'
                        }`}>
                          {p.b_score.toFixed(1)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}

// ─── Editorial fact tile ───────────────────────────────────
function Fact({ label, value, sub, emphasis = false }: {
  label: string; value: string; sub: string; emphasis?: boolean;
}) {
  return (
    <div className="border-l-2 border-gold/30 pl-5">
      <div className="font-mono text-[11px] tracking-[0.22em] text-muted mb-2">{label}</div>
      <div className={`font-serif text-[26px] leading-[1.05] mb-1 truncate ${emphasis ? 'text-gold' : 'text-cream'}`}>
        {value}
      </div>
      <div className="font-serif italic text-[13px] text-text/65 leading-snug">{sub}</div>
    </div>
  );
}

// ─── Per-stat leader card ────────────────────────────────
function LeaderCard({ title, metric, description, runners, valueOf, emphasis = false }: {
  title: string; metric: string; description: string;
  runners: Baserunner[]; valueOf: (p: Baserunner) => string; emphasis?: boolean;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5 }}
      className={`glass rounded-xl p-5 ${emphasis ? 'glass-strong' : ''}`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className={`font-mono text-[13px] tracking-[0.18em] ${emphasis ? 'text-gold' : 'text-cream'}`}>{title}</div>
        <div className="font-mono text-[11px] text-muted2">{metric}</div>
      </div>
      <div className="font-serif italic text-[12px] text-text/65 leading-snug mb-4">{description}</div>
      <ol className="space-y-2">
        {runners.map((p, i) => (
          <li
            key={p.player}
            onClick={() => window.location.assign(`/baserunner/${p.rank}`)}
            className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/[0.04] last:border-b-0 cursor-pointer hover:bg-gold/[0.04] -mx-2 px-2 rounded transition-colors"
          >
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className={`font-mono text-[11px] flex-shrink-0 ${i === 0 ? 'text-gold' : 'text-muted'}`}>
                {String(i + 1).padStart(2, '·')}
              </span>
              <span className="font-body text-[13px] text-text/90 truncate">
                {p.player.split(',').reverse().join(' ').trim()}
              </span>
              <span className="font-mono text-[11px] text-muted2 flex-shrink-0">{p.team}</span>
            </div>
            <span className={`font-display text-[20px] leading-none ${i === 0 ? 'text-gold' : 'text-cream'}`}>
              {valueOf(p)}
            </span>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

// ─── Tools-vs-Results panel (over- or under-performers) ─────
function PredictionPanel({ title, kicker, description, tint, runners }: {
  title: string; kicker: string; description: string;
  tint: 'gold' | 'rust'; runners: Baserunner[];
}) {
  const tintCls = tint === 'gold' ? 'text-gold' : 'text-rust';
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.6 }}
      className="glass-strong rounded-xl p-6"
    >
      <div className={`font-mono text-[11px] tracking-[0.22em] ${tintCls} mb-2`}>{kicker}</div>
      <h3 className="font-serif text-[26px] leading-[1.05] text-cream mb-3">{title}</h3>
      <p className="font-serif italic text-[14px] text-text/75 leading-relaxed mb-5">
        {description}
      </p>
      <ol className="space-y-2">
        {runners.map((p, i) => (
          <li
            key={p.player}
            onClick={() => window.location.assign(`/baserunner/${p.rank}`)}
            className="flex items-baseline justify-between gap-3 py-2 border-b border-white/[0.04] last:border-b-0 cursor-pointer hover:bg-gold/[0.04] -mx-2 px-2 rounded transition-colors"
          >
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className={`font-mono text-[11px] flex-shrink-0 ${i === 0 ? tintCls : 'text-muted'}`}>
                {String(i + 1).padStart(2, '·')}
              </span>
              <span className="font-body text-[13px] text-text/90 truncate">
                {p.player.split(',').reverse().join(' ').trim()}
              </span>
              <span className="font-mono text-[11px] text-muted2 flex-shrink-0">{p.team}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`font-display text-[20px] leading-none ${tintCls}`}>
                {p.bscore_gap! > 0 ? '+' : ''}{p.bscore_gap?.toFixed(1)}
              </div>
              <div className="font-mono text-[10px] text-muted2 mt-0.5">
                {p.b_score.toFixed(1)} vs {p.predicted_bscore?.toFixed(1)}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

// ─── Methodology input cell (kept from original page) ───────
function Input({ label, source, desc }: { label: string; source: string; desc: string }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[13px] tracking-[0.18em] text-gold">{label}</div>
        <div className="font-mono text-[11px] text-muted2">{source}</div>
      </div>
      <p className="font-body text-[14px] leading-[1.65] text-text/85">{desc}</p>
    </div>
  );
}

// ─── Table helpers ──────────────────────────────────────────
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-3 font-mono text-[11px] tracking-[0.16em] text-muted font-normal ${className || 'text-right'}`}>{children}</th>;
}
function Td({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <td className={`px-3 py-3 text-right font-mono text-[13px] ${muted ? 'text-muted2' : 'text-text'}`}>{children}</td>;
}
