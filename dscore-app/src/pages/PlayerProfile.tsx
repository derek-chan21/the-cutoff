import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, Trophy, Target, Shield, Activity, ChevronRight } from '../components/icons';
import { useRankings } from '../data/useRankings';
import type { Player, Pos } from '../types';
import { getTeam, teamLogo } from '../data/teams';
import BaseballLoader from '../components/BaseballLoader';
import AnimatedCounter from '../components/AnimatedCounter';
import PhysicalTools from '../components/PhysicalTools';

const POS_NAMES: Record<string, string> = {
  CF: 'Center Field', LF: 'Left Field', RF: 'Right Field',
  SS: 'Shortstop',    '2B': 'Second Base', '3B': 'Third Base',
  '1B': 'First Base', C: 'Catcher',
};
const POS_GENRE: Record<string, string[]> = {
  CF: ['OUTFIELD', 'RANGE', 'SPEED'],
  LF: ['OUTFIELD', 'CORNER'],
  RF: ['OUTFIELD', 'CORNER', 'ARM'],
  SS: ['INFIELD', 'PREMIUM', 'RANGE'],
  '2B': ['INFIELD', 'KEYSTONE', 'DP'],
  '3B': ['INFIELD', 'CORNER', 'ARM'],
  '1B': ['INFIELD', 'CORNER'],
  C: ['BATTERY', 'FRAMING', 'BLOCKING'],
};

export default function PlayerProfile() {
  const { pos, rank } = useParams<{ pos: string; rank: string }>();
  const { data, error } = useRankings();
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 800], [0, 200]);

  const { player, allAtPos } = useMemo(() => {
    if (!data || !pos || !rank) return { player: null, allAtPos: [] as Player[] };
    const list = data.rankings[pos as Pos] || [];
    const r = parseInt(rank, 10);
    return { player: list.find((p) => p.rank === r) || list[0] || null, allAtPos: list };
  }, [data, pos, rank]);

  if (error) return <div className="p-10 text-stitch">Error: {error}</div>;
  if (!data) return <BaseballLoader />;
  if (!player) return <div className="p-10 font-mono text-muted">Player not found</div>;

  const team = getTeam(player.team);
  const logo = teamLogo(player.team);
  const isC = player.position === 'C';
  const lastName = player.player.split(',')[0]?.trim() || player.player;
  const firstName = player.player.split(',')[1]?.trim() || '';
  const genres = POS_GENRE[player.position] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="relative min-h-[calc(100vh-65px)] overflow-hidden"
    >
      {/* ═══════════════════════════════════════════════════════
          POSTER HERO — full-bleed editorial layout
          overflow-hidden so the parallax photo stays inside the hero
          ═══════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '95vh' }}>
        {/* Layer 1: stadium photo with parallax */}
        <motion.div
          style={{ y: heroParallax }}
          className="absolute inset-0 z-0"
        >
          <img
            src={team.stadiumImage}
            alt=""
            className="w-full h-full object-cover"
            style={{ minHeight: '110%' }}
          />
        </motion.div>

        {/* Layer 2: team-color tint (more muted now so photo + design BOTH show) */}
        <div
          className="absolute inset-0 z-[1] mix-blend-multiply"
          style={{ background: `linear-gradient(135deg, ${team.primary}cc 0%, ${team.secondary}99 100%)` }}
        />

        {/* Layer 3: dark vignette + grid HUD */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-bg/30 via-transparent to-bg" />
        <div className="absolute inset-0 z-[2] bg-bg/25" />
        <div className="absolute inset-0 z-[2] bg-grid-faint bg-grid opacity-20 mix-blend-overlay" />

        {/* Layer 4: targeting reticle behind player headshot (Deadpool-style) */}
        <div
          className="absolute z-[3] pointer-events-none"
          style={{
            top: '50%', left: '50%', transform: 'translate(-50%, -45%)',
            width: 'min(82vw, 720px)', aspectRatio: '1/1',
          }}
        >
          <svg viewBox="0 0 600 600" className="w-full h-full">
            <defs>
              <radialGradient id="reticleFade" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={team.primary} stopOpacity="0.3" />
                <stop offset="60%" stopColor={team.primary} stopOpacity="0.05" />
                <stop offset="100%" stopColor={team.primary} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="300" r="280" fill="url(#reticleFade)" />
            <circle cx="300" cy="300" r="280" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 8" />
            <circle cx="300" cy="300" r="200" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <circle cx="300" cy="300" r="120" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {/* Crosshairs */}
            <line x1="0" y1="300" x2="600" y2="300" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <line x1="300" y1="0" x2="300" y2="600" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* ─── Foreground content ─────────────────────────── */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-7 py-8 min-h-[95vh] flex flex-col">
          {/* TOP BAR: back button + position genre chips + season */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-12">
            <Link
              to={`/rankings/${player.position}`}
              className="inline-flex items-center gap-2 font-mono text-[10px] text-text tracking-[0.18em] glass hover:glow-gold hover:-translate-x-1 transition-all px-4 py-2 rounded-full no-underline"
            >
              <ArrowLeft size={12} />
              BACK
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              {genres.map((g) => (
                <span
                  key={g}
                  className="font-mono text-[9px] tracking-[0.2em] glass px-3 py-1.5 rounded-full text-text/90"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="font-mono text-[10px] tracking-[0.2em] text-text/80">
              SEASON 2026 · #{player.rank} AT {player.position}
            </div>
          </div>

          {/* MAIN POSTER — name above, headshot below (no overlap) */}
          <div className="relative flex-1 flex flex-col items-center justify-center text-center py-4">
            {/* First name in mono caps */}
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-mono text-text/70 tracking-[0.5em] text-[clamp(12px,1.6vw,20px)] mb-2"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
            >
              {firstName.toUpperCase()}
            </motion.div>

            {/* GIANT last name */}
            <motion.h1
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.34, 1.1, 0.64, 1] }}
              className="font-display tracking-[0.01em] leading-[0.85] w-full"
              style={{
                fontSize: `clamp(70px, ${22 / Math.max(lastName.length, 4)}vw, 240px)`,
                color: '#fff',
                textShadow: `0 0 60px ${team.primary}aa, 0 0 100px ${team.primary}55, 0 6px 30px rgba(0,0,0,0.85)`,
              }}
            >
              {lastName.toUpperCase()}
            </motion.h1>

            {/* Underline */}
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.9, ease: 'easeOut' }}
              style={{ originX: 0.5, background: `linear-gradient(90deg, transparent, ${team.primary}, transparent)` }}
              className="h-[2px] w-[50%] max-w-[400px] mt-4 mb-6"
            />

            {/* Player headshot — centered BELOW the name, no overlap */}
            {player.headshot && (
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.9, ease: [0.34, 1.1, 0.64, 1] }}
                className="relative"
              >
                <div
                  className="absolute inset-0 rounded-full blur-3xl opacity-80"
                  style={{ background: `radial-gradient(circle, ${team.primary}cc, transparent 70%)`, transform: 'scale(1.5)' }}
                />
                <img
                  src={player.headshot}
                  alt=""
                  className="relative rounded-full object-cover border-4 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
                  style={{
                    width: 'clamp(180px, 22vw, 280px)',
                    height: 'clamp(180px, 22vw, 280px)',
                    borderColor: team.primary,
                  }}
                />
              </motion.div>
            )}
          </div>

          {/* BOTTOM ROW — description + CTA + ballpark + logo */}
          <div className="grid md:grid-cols-[1fr_auto_auto] gap-6 items-end mt-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="max-w-[460px]"
            >
              <div className="font-mono text-[10px] text-text/60 tracking-[0.22em] mb-2">PLAYER PROFILE</div>
              <p className="font-body text-[13px] leading-relaxed text-text/90 line-clamp-3">
                {player.description}
              </p>
            </motion.div>

            <motion.a
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
              whileHover={{ scale: 1.05 }}
              href={`#stats`}
              onClick={(e) => { e.preventDefault(); document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-3 px-7 py-4 rounded-full font-mono text-[11px] tracking-[0.2em] glass-strong text-text hover:glow-gold transition-all no-underline"
              style={{ borderColor: `${team.primary}66` }}
            >
              VIEW BREAKDOWN
              <ChevronRight size={14} />
            </motion.a>

            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-right"
            >
              {logo && (
                <img src={logo} alt={team.name} className="w-[80px] h-[80px] object-contain mb-2 ml-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]" />
              )}
              <div className="font-mono text-[10px] text-text/70 tracking-[0.12em]">
                {team.ballpark}
              </div>
              <div className="font-mono text-[9px] text-text/50 tracking-wider">
                {team.city.toUpperCase()}
              </div>
            </motion.div>
          </div>

          {/* Film perforation strip — the iconic Deadpool detail */}
          <div className="absolute bottom-0 left-0 right-0 h-3 flex items-center">
            <div className="w-full h-1 flex justify-between items-center px-2">
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i} className="w-1 h-1 rounded-sm bg-text/15" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS SECTION — below the hero
          Solid dark bg + high z so no hero photo bleeds through
          ═══════════════════════════════════════════════════════ */}
      <section id="stats" className="relative z-20 bg-bg">
      <div className="max-w-[1100px] mx-auto px-7 py-16">
        {/* Eyebrow */}
        <div className="font-mono text-[10px] tracking-[0.25em] text-gold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold pulse-dot glow-gold" />
          DEFENSIVE METRICS · POSITION-WEIGHTED
        </div>

        {/* Section headline */}
        <h2 className="font-display text-[clamp(40px,7vw,80px)] leading-none mb-8 max-w-[800px]">
          <span className="text-text">EVERY SKILL.</span>{' '}
          <span className=" text-gold">MEASURED.</span>
        </h2>

        {/* Big stats grid */}
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10"
        >
          <BigStat label="D-SCORE" value={player.adj_dscore} decimals={1} icon={<Trophy size={16} />} tint={team.primary} primary />
          <BigStat label={isC ? 'FRAMING' : 'OAA'} value={isC ? (player.frv || 0) : player.oaa} decimals={isC ? 2 : 0} sub="runs vs avg" icon={<Target size={16} />} tint={team.primary} />
          <BigStat label="ARM" value={player.arm_runs || 0} decimals={1} sub="throwing runs" icon={<Activity size={16} />} tint={team.primary} />
          <BigStat label="DRS" value={player.drs} decimals={0} sub="overall runs saved" icon={<Shield size={16} />} tint={team.primary} />
        </motion.div>

        {/* Component breakdown */}
        <MetricGrid player={player} isC={isC} teamPrimary={team.primary} />

        {/* Physical tools — Statcast-measured raw athleticism */}
        <PhysicalTools player={player} />

        {/* Leaderboard */}
        <motion.div
          initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mt-12"
        >
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-3">
            <h2 className="font-display text-[clamp(28px,4vw,48px)] leading-none">
              <span className="text-text">{POS_NAMES[player.position]?.toUpperCase()}</span>{' '}
              <span className="text-gold">LEADERS</span>
            </h2>
            <div className="font-mono text-[10px] text-muted tracking-wider">{allAtPos.length} QUALIFIED PLAYERS</div>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted font-normal">#</th>
                  <th className="text-left px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted font-normal">Player</th>
                  <th className="text-left px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted font-normal">Team</th>
                  <th className="text-right px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted font-normal">{isC ? 'FRV' : 'OAA'}</th>
                  <th className="text-right px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted font-normal">ARM</th>
                  <th className="text-right px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted font-normal">DRS</th>
                  <th className="text-right px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted font-normal">D-Score</th>
                </tr>
              </thead>
              <tbody>
                {allAtPos.slice(0, Math.max(10, player.rank + 2)).map((p) => (
                  <tr
                    key={p.rank}
                    onClick={() => window.location.assign(`/player/${p.position}/${p.rank}`)}
                    className={`border-t border-white/[0.05] cursor-pointer transition-colors hover:bg-gold/[0.05] ${
                      p.rank === player.rank ? 'bg-gold/[0.08]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-muted">#{p.rank}</td>
                    <td className={`px-4 py-3 text-[13px] ${p.rank === player.rank ? 'text-gold font-medium' : ''}`}>{p.player}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted">{p.team}</td>
                    <td className="px-4 py-3 text-right font-mono text-[12px]">{isC ? fmt(p.frv || 0) : (p.oaa >= 0 ? '+' : '') + p.oaa}</td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-muted2">{fmt(p.arm_runs || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-muted2">{p.drs === 0 ? '—' : (p.drs >= 0 ? '+' : '') + p.drs}</td>
                    <td className={`px-4 py-3 text-right font-display text-[20px] ${p.rank === player.rank ? 'text-gold text-gold' : ''}`}>
                      {p.adj_dscore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      </section>
    </motion.div>
  );
}

function fmt(v: number) { return v === 0 ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1); }

// ── Big stat card ────────────────────────────────────────────
function BigStat({ label, value, decimals = 1, sub, tint, icon, primary }: {
  label: string; value: number; decimals?: number; sub?: string; tint?: string; icon?: React.ReactNode; primary?: boolean;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className={`relative glass rounded-xl p-5 overflow-hidden group ${primary ? 'glass-strong' : ''}`}
    >
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: tint || '#00d4ff' }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${tint || '#00d4ff'}, transparent)` }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted2">{label}</span>
          {icon && <span className="opacity-70" style={{ color: tint || '#00d4ff' }}>{icon}</span>}
        </div>
        <div className="font-display text-[48px] leading-none" style={{ color: primary ? '#fff' : tint || '#00d4ff' }}>
          <AnimatedCounter value={value} decimals={decimals} prefix={value >= 0 && !label.includes('SCORE') ? '+' : ''} />
        </div>
        {sub && <div className="font-mono text-[10px] text-muted mt-2 tracking-[0.06em]">{sub}</div>}
      </div>
    </motion.div>
  );
}

function MetricGrid({ player, isC, teamPrimary }: { player: Player; isC: boolean; teamPrimary: string }) {
  const bar = (v: number) => Math.min(100, Math.max(8, 50 + (v / 5) * 50));
  const components = isC
    ? [
        { label: 'Framing',      val: player.frv || 0,        wt: 32, desc: 'Runs added by stealing called strikes above avg.' },
        { label: 'Throwing',     val: player.arm_runs || 0,   wt: 22, desc: `${player.cs || 0} CS / ${player.sb || 0} SB allowed.` },
        { label: 'Blocking',     val: player.block_runs || 0, wt: 13, desc: `${player.pb || 0} PBs · wild pitches blocked.` },
        { label: 'Game Calling', val: player.cera_runs || 0,  wt: 10, desc: 'Effect on staff ERA above expectation.' },
        { label: 'Overall DRS',  val: player.drs,             wt: 23, desc: 'Total Defensive Runs Saved.' },
      ]
    : [
        { label: 'Range (OAA)',  val: player.oaa,             wt: posWeight(player.position, 'oaa'),  desc: `Outs above avg at ${player.position}.` },
        { label: 'Arm',          val: player.arm_runs || 0,   wt: posWeight(player.position, 'arm'),  desc: 'Throwing runs prevented vs avg.' },
        ...(['SS','2B','3B','1B'].includes(player.position) ? [{
          label: 'Double Plays', val: player.dp_runs || 0,    wt: posWeight(player.position, 'dp'),   desc: 'DP runs prevented vs avg.'
        }] : []),
        { label: 'Overall DRS',  val: player.drs,             wt: posWeight(player.position, 'drs'),  desc: 'Total Defensive Runs Saved.' },
      ];

  return (
    <motion.div
      initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      <div className="font-mono text-[10px] tracking-[0.2em] text-gold uppercase mb-4 flex items-center gap-2">
        <Shield size={13} />
        Component Breakdown
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {components.map((c) => (
          <motion.div
            key={c.label}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -2 }}
            className="glass rounded-xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${teamPrimary}, transparent)` }} />
            <div className="flex items-baseline justify-between mb-2">
              <div className="font-mono text-[10px] tracking-[0.16em] text-muted2 uppercase">{c.label}</div>
              <div className="font-mono text-[9px] text-gold tracking-wider">{c.wt}%</div>
            </div>
            <div className="font-display text-[40px] leading-none my-2" style={{ color: teamPrimary }}>
              <AnimatedCounter value={c.val} decimals={1} prefix={c.val >= 0 ? '+' : ''} />
            </div>
            <div className="font-body text-[12px] text-muted2 leading-snug mb-3 font-light">{c.desc}</div>
            <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${bar(c.val)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.34, 1.2, 0.64, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${teamPrimary}, #00d4ff)` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const POS_W: Record<string, { oaa: number; arm: number; dp: number; drs: number }> = {
  CF: { oaa: 55, arm: 10, dp: 0, drs: 35 },
  LF: { oaa: 35, arm: 15, dp: 0, drs: 50 },
  RF: { oaa: 35, arm: 25, dp: 0, drs: 40 },
  SS: { oaa: 45, arm: 15, dp: 10, drs: 30 },
  '2B': { oaa: 40, arm: 5, dp: 20, drs: 35 },
  '3B': { oaa: 40, arm: 20, dp: 5, drs: 35 },
  '1B': { oaa: 25, arm: 5, dp: 5, drs: 65 },
};
function posWeight(pos: string, k: 'oaa' | 'arm' | 'dp' | 'drs') { return POS_W[pos]?.[k] ?? 0; }
