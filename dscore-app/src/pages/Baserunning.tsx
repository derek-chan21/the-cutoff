import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Trophy } from '../components/icons';
import { useRankings } from '../data/useRankings';
import { getTeam } from '../data/teams';
import BaseballLoader from '../components/BaseballLoader';

// Editorial baserunning section. Parallels the defensive D-Score page
// in tone and layout but lives at /baserunning. Shows the wBsR leaders,
// SB success rate, and computed B-Score (weighted composite).

export default function Baserunning() {
  const { data, error } = useRankings();
  const runners = data?.baserunning_rankings || [];

  // Aggregate impact — used in the "fact strip" to make the point that
  // baserunning is meaningful in real run terms.
  const impact = useMemo(() => {
    if (!runners.length) return null;
    const top25 = runners.slice(0, 25);
    const totalWBsR = top25.reduce((s, p) => s + p.wbsr, 0);
    const totalSB = top25.reduce((s, p) => s + p.sb, 0);
    const top = runners[0];
    return {
      total: runners.length,
      top25Runs: totalWBsR.toFixed(1),
      top25SB: totalSB,
      topName: top.player.split(',').reverse().join(' ').trim(),
      topScore: top.b_score,
      topTeam: top.team,
    };
  }, [runners]);

  if (error) return (
    <div className="max-w-[1100px] mx-auto px-7 py-16">
      <div className="glass border border-rust/30 rounded-xl p-6 font-mono text-sm text-rust">
        Could not load data: {error}
      </div>
    </div>
  );
  if (!data) return <BaseballLoader />;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* ═══════════════════════════════════════════════════════
          HERO — editorial, matches the D-Score home page rhythm
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pt-12 pb-12">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[13px] text-gold tracking-[0.18em] hover:-translate-x-1 transition-all mb-8 no-underline"
        >
          <ArrowLeft size={12} />
          BACK TO THE INDEX
        </Link>

        {/* Top eyebrow rule */}
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

        {/* Title block */}
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
            A "cutoff" — the relay throw, the outfielder's last hope of stopping
            a run from scoring — is the single most decisive moment in baseball
            between a base hit and a run on the board. Baserunning is the other
            half of that equation.
          </motion.p>

          <motion.p
            initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="font-body text-[16px] leading-[1.7] text-text/85 max-w-[680px] mb-10"
          >
            It rarely makes the highlight reel, and it almost never makes the box
            score in any obvious way. But the best baserunners can be worth ten
            runs over a season — the same as a hitter's full-season WAR bump.
            They take the extra base. They steal at a 75%+ clip. They turn a
            single into a double on a routine flyout. This is their chapter.
          </motion.p>
        </div>

        {/* Impact fact strip */}
        {impact && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-10 pt-8 border-t border-gold/20 grid grid-cols-2 md:grid-cols-4 gap-y-7 gap-x-10"
          >
            <Fact label="QUALIFIED RUNNERS" value={impact.total.toString()} sub="50+ plate appearances" />
            <Fact label="LEAGUE LEADER" value={impact.topName} sub={`${impact.topTeam}`} />
            <Fact label="TOP B-SCORE" value={impact.topScore.toFixed(1)} sub="composite, position-independent" emphasis />
            <Fact label="TOP-25 IMPACT" value={`+${impact.top25Runs}`} sub={`runs · ${impact.top25SB} steals combined`} />
          </motion.div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          METHODOLOGY EXPLAINER — quick, scannable
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pb-8">
        <motion.div
          initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
          className="border-t border-gold/20 pt-8"
        >
          <div className="font-mono text-[13px] tracking-[0.25em] text-rust mb-3">
            HOW THE B-SCORE IS BUILT
          </div>
          <p className="font-serif italic text-[16px] text-text/80 max-w-[680px] mb-5">
            One composite score, on the same 0-to-99 scale as the D-Score,
            built from three public inputs:
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              label="wBsR"
              source="FanGraphs"
              desc="Weighted Base Running runs. The headline number — every taken base, every advance on a flyout, every smart read converted into runs prevented or added vs. an average baserunner."
            />
            <Input
              label="STOLEN BASE SUCCESS"
              source="MLB"
              desc="Stolen base success rate, adjusted with a small prior so a 3-for-3 small sample doesn't dominate the leaderboard. Break-even is roughly 75 percent — below that, the outs cost you more than the bases earn."
            />
            <Input
              label="SPEED SCORE"
              source="FanGraphs"
              desc="Bill James's classic Spd composite — a measure of raw running ability drawn from steals, triples, runs scored per time on base, and similar context-free signals."
            />
          </div>
          <p className="font-mono text-[12px] text-text/55 italic mt-5 max-w-[680px]">
            The exact weights between the three are kept private — the same
            policy as the D-Score. What they're applied to is everything above.
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LEADERBOARD — top 50 by B-Score
          ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1280px] mx-auto px-7 pb-20">
        <motion.div
          initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
          className="border-t border-gold/20 pt-10"
        >
          <div className="flex items-end justify-between gap-6 mb-7 flex-wrap">
            <div>
              <div className="font-mono text-[13px] tracking-[0.25em] text-rust mb-3 flex items-center gap-2">
                <Trophy size={14} className="text-gold" />
                THE LEADERBOARD
              </div>
              <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1] tracking-[-0.01em] text-cream">
                The thieves and <span className="italic text-gold">the smart runners.</span>
              </h2>
            </div>
            <p className="font-serif italic text-[14px] text-text/65 max-w-[320px]">
              Top {Math.min(50, runners.length)} by B-Score. Sort below by any column.
            </p>
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
                      className={`border-b border-white/[0.05] hover:bg-gold/[0.04] transition-colors ${
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
                      <td className="px-3 py-3 font-mono text-[12px] text-muted2">{p.team || '—'}</td>
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

          {/* Footer note */}
          <div className="font-mono text-[11px] text-muted tracking-wide mt-5 leading-relaxed max-w-[820px]">
            <Activity size={11} className="inline -mt-1 mr-1.5 text-gold" />
            <strong className="text-text">wBsR</strong> = weighted base running runs · <strong className="text-text">SB%</strong> = stolen base success rate (with 3-attempt prior) · <strong className="text-text">SPD</strong> = FanGraphs Speed Score · <strong className="text-text">SPRINT</strong> = Statcast top-end speed (ft/sec) · <strong className="text-text">B-SCORE</strong> = weighted composite (0-99)
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}

// ── Single editorial fact ──────────────────────────────────────
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

// ── Single methodology input card ─────────────────────────────
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

// ── Table cell helpers ─────────────────────────────────────────
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 font-mono text-[11px] tracking-[0.16em] text-muted font-normal ${className || 'text-right'}`}>
      {children}
    </th>
  );
}
function Td({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td className={`px-3 py-3 text-right font-mono text-[13px] ${muted ? 'text-muted2' : 'text-text'}`}>
      {children}
    </td>
  );
}
