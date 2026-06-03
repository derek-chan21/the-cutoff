import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Activity, Trophy, Target } from '../components/icons';
import { useRankings } from '../data/useRankings';
import { getTeam, teamLogo } from '../data/teams';
import BaseballLoader from '../components/BaseballLoader';
import AnimatedCounter from '../components/AnimatedCounter';

// Individual baserunner profile — accessed from the leaderboard.
// Centerpiece is the PERCENTILE SPEED RANK + percentile bars on every
// stat, so you can see where this runner sits across the league.

// Compute "higher is better" percentile rank (90 = faster than 90%)
function percentile(value: number, values: number[]): number {
  if (!values.length || !value) return 0;
  const valid = values.filter(v => v && v > 0);
  if (!valid.length) return 0;
  const below = valid.filter(v => v < value).length;
  return Math.round((below / valid.length) * 100);
}

export default function BaserunnerProfile() {
  const { rank } = useParams<{ rank: string }>();
  const { data, error } = useRankings();
  const runners = data?.baserunning_rankings || [];

  const player = useMemo(
    () => runners.find(p => p.rank === parseInt(rank || '1', 10)) || runners[0],
    [runners, rank]
  );

  // Pre-compute percentiles for every numeric stat (skipping zero/missing)
  const pct = useMemo(() => {
    if (!player || !runners.length) return null;
    return {
      sprint:    percentile(player.sprint_speed, runners.map(p => p.sprint_speed)),
      wbsr:      percentile(player.wbsr,         runners.map(p => p.wbsr)),
      sb:        percentile(player.sb,           runners.map(p => p.sb)),
      sbSuccess: percentile(player.sb_success,   runners.map(p => p.sb_success)),
      spd:       percentile(player.spd,          runners.map(p => p.spd)),
      bScore:    percentile(player.b_score,      runners.map(p => p.b_score)),
    };
  }, [player, runners]);

  if (error) return <div className="p-10 text-rust">Error: {error}</div>;
  if (!data) return <BaseballLoader />;
  if (!player || !pct) return <div className="p-10 font-mono text-muted">Runner not found</div>;

  const team = getTeam(player.team);
  const logo = teamLogo(player.team);
  const lastName = player.player.split(',')[0]?.trim() || player.player;
  const firstName = player.player.split(',')[1]?.trim() || '';
  const isSmart = (player.bscore_gap || 0) > 5;
  const isWasted = (player.bscore_gap || 0) < -5;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="relative max-w-[1100px] mx-auto px-7 pt-8 pb-20"
    >
      <Link
        to="/baserunning"
        className="inline-flex items-center gap-2 font-mono text-[13px] text-gold tracking-[0.18em] hover:-translate-x-1 transition-all mb-8 no-underline"
      >
        <ArrowLeft size={12} />
        BACK TO BASERUNNING
      </Link>

      {/* ── HERO: name + headshot + team ───────────────────── */}
      <motion.section
        initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid md:grid-cols-[1fr_auto] gap-7 items-end pb-10 border-b border-gold/20 mb-10"
      >
        <div>
          <div className="font-mono text-[13px] tracking-[0.3em] text-rust mb-4">
            PROFILE · BASERUNNING · #{player.rank}
          </div>
          <div className="font-mono text-[13px] tracking-[0.18em] text-muted2 mb-3">
            {firstName.toUpperCase()}
          </div>
          <h1 className="font-serif text-[clamp(48px,7vw,96px)] leading-[0.95] tracking-[-0.01em] text-cream mb-5">
            {lastName}
          </h1>
          <div className="flex items-center gap-3 font-mono text-[13px] text-muted2 tracking-wide flex-wrap">
            <span className="text-text">{team.name}</span>
            <span className="w-1 h-1 bg-muted rounded-full" />
            <span>{player.pa} PA</span>
            <span className="w-1 h-1 bg-muted rounded-full" />
            {isSmart && <span className="text-gold">OUTPERFORMS TOOLS</span>}
            {isWasted && <span className="text-rust">TRAILS TOOLS</span>}
            {!isSmart && !isWasted && <span>MEETS TOOLS</span>}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {player.headshot && (
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-60"
                style={{ background: `radial-gradient(circle, ${team.primary}cc, transparent 70%)`, transform: 'scale(1.4)' }}
              />
              <img
                src={player.headshot}
                alt=""
                className="relative w-[140px] h-[140px] rounded-full object-cover border-2 shadow-2xl"
                style={{ borderColor: team.primary }}
              />
            </div>
          )}
          {logo && (
            <img src={logo} alt={team.name} className="w-[60px] h-[60px] object-contain drop-shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>
      </motion.section>

      {/* ── BIG STAT CARDS ──────────────────────────────────── */}
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12"
      >
        <BigStat label="B-SCORE" value={player.b_score} pctRank={pct.bScore} icon={<Trophy size={16} />} primary />
        <BigStat label="SPRINT SPEED" value={player.sprint_speed} unit="ft/s" pctRank={pct.sprint} icon={<Activity size={16} />} highlight />
        <BigStat label="wBsR" value={player.wbsr} pctRank={pct.wbsr} icon={<Target size={16} />} sign />
        <BigStat label="SB SUCCESS" value={player.sb_success} unit="%" pctRank={pct.sbSuccess} icon={<Activity size={16} />} />
      </motion.div>

      {/* ── PERCENTILE RANK PANEL — the centerpiece ───────── */}
      <motion.section
        initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className="font-mono text-[13px] tracking-[0.22em] text-gold mb-3 flex items-center gap-2">
          <Activity size={13} />
          LEAGUE PERCENTILE RANK
        </div>
        <p className="font-serif italic text-[15px] text-text/75 mb-6 max-w-[700px]">
          Where {lastName} sits among the {runners.length} qualified baserunners
          this season. Higher bars mean a higher rank — 99 is best in the league.
        </p>

        <div className="glass-strong rounded-2xl p-6 md:p-8">
          <PercentileBar label="Sprint Speed"   value={player.sprint_speed}  pct={pct.sprint}    raw={`${player.sprint_speed} ft/s`} />
          <PercentileBar label="wBsR"            value={player.wbsr}          pct={pct.wbsr}      raw={`${player.wbsr >= 0 ? '+' : ''}${player.wbsr.toFixed(2)} runs`} />
          <PercentileBar label="Stolen Bases"    value={player.sb}            pct={pct.sb}        raw={`${player.sb}`} />
          <PercentileBar label="SB Success Rate" value={player.sb_success}    pct={pct.sbSuccess} raw={`${player.sb_success.toFixed(1)}%`} />
          <PercentileBar label="Speed Score"     value={player.spd}           pct={pct.spd}       raw={player.spd.toFixed(1)} last />
        </div>
      </motion.section>

      {/* ── PREDICTION MODEL — tools vs results for this runner ── */}
      {player.predicted_bscore !== undefined && player.bscore_gap !== undefined && (
        <motion.section
          initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="font-mono text-[13px] tracking-[0.22em] text-gold mb-3 flex items-center gap-2">
            <Target size={13} />
            TOOLS vs RESULTS
          </div>
          <p className="font-serif italic text-[15px] text-text/75 mb-6 max-w-[680px]">
            What B-Score would {lastName}'s raw tools alone predict? And does the
            actual season production beat that, miss it, or match?
          </p>
          <div className="glass-strong rounded-2xl p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6 items-end mb-6">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-muted2 mb-2">EXPECTED (FROM TOOLS)</div>
                <div className="font-display text-[48px] leading-none text-cream">
                  <AnimatedCounter value={player.predicted_bscore} decimals={1} />
                </div>
                <div className="font-mono text-[11px] text-muted2 mt-2">model prediction</div>
              </div>
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-muted2 mb-2">ACTUAL B-SCORE</div>
                <div className={`font-display text-[48px] leading-none ${isSmart ? 'text-gold' : isWasted ? 'text-rust' : 'text-cream'}`}>
                  <AnimatedCounter value={player.b_score} decimals={1} />
                </div>
                <div className="font-mono text-[11px] text-muted2 mt-2">season-to-date</div>
              </div>
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-muted2 mb-2">GAP</div>
                <div className={`font-display text-[48px] leading-none ${isSmart ? 'text-gold' : isWasted ? 'text-rust' : 'text-cream'}`}>
                  {player.bscore_gap >= 0 ? '+' : ''}{player.bscore_gap.toFixed(1)}
                </div>
                <div className="font-mono text-[11px] text-muted2 mt-2">
                  {isSmart ? 'over tools' : isWasted ? 'under tools' : 'in line'}
                </div>
              </div>
            </div>
            <p className="font-serif italic text-[15px] leading-relaxed text-text/85 max-w-[700px] pt-4 border-t border-text/10">
              {isSmart
                ? `Outperforms what the raw tools predict by ${Math.abs(player.bscore_gap).toFixed(1)} points. Likely smart reads, good jumps, decisive routes — instinct ahead of measurement.`
                : isWasted
                ? `Trails the tools by ${Math.abs(player.bscore_gap).toFixed(1)} points. Either rarely runs, gets caught when he does, or both. The athleticism is there — the conversion isn't yet.`
                : `In line with what the raw tools predict. What you see on the radar gun is roughly what shows up on the basepaths.`}
            </p>
          </div>
        </motion.section>
      )}

      {/* ── Back to leaderboard ─────────────────────────────── */}
      <motion.div
        initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="border-t border-gold/20 pt-10 flex items-center justify-between flex-wrap gap-4"
      >
        <p className="font-serif italic text-[15px] text-text/70">
          Continue reading the rest of the leaderboard.
        </p>
        <Link
          to="/baserunning"
          className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-mono text-[13px] tracking-[0.18em] bg-gold text-bg hover:bg-cream transition-colors no-underline"
        >
          BACK TO BASERUNNING INDEX
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─── Big stat card (top row) ─────────────────────────────
function BigStat({ label, value, pctRank, unit, icon, primary = false, highlight = false, sign = false }: {
  label: string; value: number; pctRank: number; unit?: string;
  icon?: React.ReactNode; primary?: boolean; highlight?: boolean; sign?: boolean;
}) {
  const display = sign && value >= 0 ? `+${value.toFixed(value < 10 ? 2 : 1)}` :
                  value.toFixed(unit === '%' || unit === 'ft/s' ? 1 : 1);
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.5 }}
      className={`relative glass rounded-xl p-5 overflow-hidden ${primary || highlight ? 'glass-strong' : ''}`}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] tracking-[0.16em] text-muted2">{label}</span>
        {icon && <span className="text-gold opacity-80">{icon}</span>}
      </div>
      <div className={`font-display text-[44px] leading-none ${primary ? 'text-gold' : highlight ? 'text-cream' : 'text-text'}`}>
        {display}{unit && <span className="text-[18px] font-mono ml-1 text-muted2">{unit}</span>}
      </div>
      <div className="mt-3 pt-3 border-t border-text/10">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] tracking-[0.16em] text-muted">PERCENTILE</span>
          <span className={`font-display text-[20px] leading-none ${pctRank >= 80 ? 'text-gold' : pctRank >= 50 ? 'text-cream' : 'text-muted2'}`}>
            {pctRank}<span className="text-[12px] font-mono ml-1">{ordinal(pctRank)}</span>
          </span>
        </div>
        <div className="mt-2 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }} whileInView={{ width: `${pctRank}%` }}
            viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-rust to-gold rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Per-stat percentile bar ─────────────────────────────
function PercentileBar({ label, pct, raw, last = false }: {
  label: string; value: number; pct: number; raw: string; last?: boolean;
}) {
  const tier = pct >= 90 ? 'ELITE' : pct >= 70 ? 'PLUS' : pct >= 40 ? 'AVERAGE' : 'BELOW AVG';
  const tierCls = pct >= 90 ? 'text-gold' : pct >= 70 ? 'text-cream' : pct >= 40 ? 'text-muted2' : 'text-rust';
  return (
    <div className={`py-4 ${last ? '' : 'border-b border-white/[0.06]'}`}>
      <div className="flex items-baseline justify-between mb-2 gap-4">
        <div>
          <div className="font-serif text-[18px] text-cream">{label}</div>
          <div className="font-mono text-[12px] text-muted2 mt-0.5">{raw}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`font-display text-[32px] leading-none ${tierCls}`}>
            {pct}<span className="text-[14px] font-mono ml-1 text-muted2">{ordinal(pct)}</span>
          </div>
          <div className={`font-mono text-[10px] tracking-[0.18em] mt-1 ${tierCls}`}>{tier}</div>
        </div>
      </div>
      <div className="h-[6px] bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.34, 1.2, 0.64, 1] }}
          className="h-full rounded-full"
          style={{
            background: pct >= 70
              ? 'linear-gradient(90deg, #c25d3f, #c69749)'   // rust→gold for elite
              : 'linear-gradient(90deg, #c25d3f, #998d77)',  // rust→muted for below
          }}
        />
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
