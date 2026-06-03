import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from '../components/icons';
import { useRankings } from '../data/useRankings';
import type { Player, Pos } from '../types';
import { getTeam } from '../data/teams';
import BaseballLoader from '../components/BaseballLoader';

const POS_NAMES: Record<string, string> = {
  CF: 'Center Field', LF: 'Left Field', RF: 'Right Field',
  SS: 'Shortstop',    '2B': 'Second Base', '3B': 'Third Base',
  '1B': 'First Base', C: 'Catcher', ALL: 'All Positions',
};
const ALL_POS: Pos[] = ['CF', 'SS', 'C', '2B', '3B', 'RF', 'LF', '1B'];

type SortCol = 'oaa' | 'arm_runs' | 'dp_runs' | 'drs' | 'frv' | 'block_runs' | 'cera_runs' | 'dwar' | 'adj_dscore';

export default function RankingsView() {
  const { pos } = useParams<{ pos: string }>();
  const filterPos = (pos || 'ALL') as Pos | 'ALL';
  const isC = filterPos === 'C';
  const { data, error } = useRankings();
  const [team, setTeam] = useState('ALL');
  const [sortCol, setSortCol] = useState<SortCol>('adj_dscore');
  const [sortAsc, setSortAsc] = useState(false);

  const allPlayers: Player[] = useMemo(() => {
    if (!data) return [];
    if (filterPos === 'ALL') return ALL_POS.flatMap((p) => data.rankings[p] || []);
    return data.rankings[filterPos as Pos] || [];
  }, [data, filterPos]);

  const teams = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    ALL_POS.forEach((p) => (data.rankings[p] || []).forEach((pl) => pl.team && set.add(pl.team)));
    return Array.from(set).sort();
  }, [data]);

  const players = useMemo(() => {
    let list = allPlayers;
    if (team !== 'ALL') list = list.filter((p) => p.team === team);
    return [...list].sort((a, b) => {
      const va = (+(a as never)[sortCol]) || 0;
      const vb = (+(b as never)[sortCol]) || 0;
      if (va === vb) return (b.adj_dscore || 0) - (a.adj_dscore || 0);
      return sortAsc ? va - vb : vb - va;
    });
  }, [allPlayers, team, sortCol, sortAsc]);

  if (error) return (
    <div className="max-w-[1000px] mx-auto px-7 py-16">
      <div className="glass border border-stitch/30 rounded-xl p-6 font-mono text-sm text-stitch">
        Could not load data: {error}
      </div>
    </div>
  );
  if (!data) return <BaseballLoader />;

  const setSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };
  const arrow = (col: SortCol) =>
    sortCol !== col ? <span className="text-muted ml-1 text-[13px] opacity-50">⬍</span>
                    : <span className="ml-1 text-[13px] text-gold">{sortAsc ? '▲' : '▼'}</span>;
  const SortableHeader = ({ col, label }: { col: SortCol; label: string }) => (
    <th
      onClick={() => setSort(col)}
      className={`text-right cursor-pointer select-none whitespace-nowrap transition-colors px-3 py-3 font-mono text-[13px] tracking-[0.16em] font-normal border-b border-white/[0.06] ${
        sortCol === col ? 'text-gold' : 'text-muted hover:text-text'
      }`}
    >
      {label}{arrow(col)}
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="max-w-[1100px] mx-auto px-7 py-7"
    >
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-[13px] text-gold tracking-[0.18em]
                   glass hover:glow-gold hover:-translate-x-1 transition-all px-4 py-2 rounded-full no-underline mb-7"
      >
        <ArrowLeft size={12} />
        BACK TO THE FIELD
      </Link>

      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-7 pb-5 border-b border-gold/15 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="font-mono text-[13px] text-gold tracking-[0.22em] mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-dot glow-gold" />
            VIEWING POSITION
          </div>
          <div className="font-display text-[44px] leading-none text-gold">
            {POS_NAMES[filterPos] || filterPos}
          </div>
          <div className="font-mono text-[13px] text-muted2 mt-3 tracking-[0.1em]">
            {players.length} players · sorted by {sortCol.toUpperCase()} {sortAsc ? '▲' : '▼'}
          </div>
        </div>
        <div>
          <div className="font-mono text-[13px] tracking-[0.2em] text-muted mb-2">TEAM FILTER</div>
          <select
            value={team} onChange={(e) => setTeam(e.target.value)}
            className="appearance-none glass text-text font-mono text-[13px]
                       px-4 py-2.5 rounded-lg min-w-[200px] cursor-pointer outline-none
                       hover:border-gold/40 focus:border-gold focus:glow-gold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <option value="ALL" className="bg-bg">All Teams</option>
            {teams.map((t) => <option key={t} value={t} className="bg-bg">{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table — wrapped in glass card */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-3 font-mono text-[13px] tracking-[0.16em] text-muted font-normal border-b border-white/[0.06]">#</th>
              <th className="text-left px-3 py-3 font-mono text-[13px] tracking-[0.16em] text-muted font-normal border-b border-white/[0.06]">Player</th>
              {filterPos === 'ALL' && <th className="text-right px-3 py-3 font-mono text-[13px] tracking-[0.16em] text-muted font-normal border-b border-white/[0.06]">POS</th>}
              {isC ? (
                <>
                  <SortableHeader col="frv" label="FRV" />
                  <SortableHeader col="arm_runs" label="ARM" />
                  <SortableHeader col="block_runs" label="BLK" />
                  <SortableHeader col="cera_runs" label="CERA" />
                  <SortableHeader col="drs" label="DRS" />
                </>
              ) : (
                <>
                  <SortableHeader col="oaa" label="OAA" />
                  <SortableHeader col="arm_runs" label="ARM" />
                  <SortableHeader col="drs" label="DRS" />
                </>
              )}
              <SortableHeader col="dwar" label="D-WAR" />
              <SortableHeader col="adj_dscore" label="D-SCORE" />
              <th className="border-b border-white/[0.06]" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => (
                <PlayerRow key={`${p.position}-${p.rank}-${p.player}`} p={p} idx={i} showPos={filterPos === 'ALL'} isC={isC} />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function fmt(v: number) { return v === 0 ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1); }
function scoreCls(s: number) { return s >= 75 ? 'text-gold text-gold' : s >= 55 ? 'text-gold' : 'text-muted2'; }

function PlayerRow({ p, idx, showPos, isC }: { p: Player; idx: number; showPos: boolean; isC: boolean }) {
  const initial = (p.player.split(',')[0] || '?').charAt(0).toUpperCase();
  const pct = Math.round(Math.min(p.adj_dscore / 99, 1) * 100);
  const team = getTeam(p.team);
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ delay: Math.min(idx * 0.022, 0.5), duration: 0.4 }}
      className={`border-b border-white/[0.05] cursor-pointer transition-colors hover:bg-gold/[0.04] ${
        idx === 0 ? 'bg-gold/[0.05]' : ''
      }`}
      style={idx === 0 ? { borderLeft: `2px solid ${team.primary}` } : {}}
      onClick={() => window.location.assign(`/player/${p.position}/${p.rank}`)}
    >
      <td className="px-3 py-3 w-[42px] text-center font-mono text-[13px] text-muted">
        {idx === 0 ? <span className="text-gold font-semibold text-gold">#1</span> : `#${idx + 1}`}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          {p.headshot ? (
            <img src={p.headshot} alt="" className="w-[38px] h-[38px] rounded-full object-cover border border-white/[0.08] bg-surface flex-shrink-0" />
          ) : (
            <div className="w-[38px] h-[38px] rounded-full glass flex items-center justify-center font-mono text-[13px] text-muted flex-shrink-0">{initial}</div>
          )}
          <div>
            <div className="text-sm font-medium">{p.player}</div>
            <div className="text-[13px] text-muted2 font-mono tracking-wide">{p.team}{showPos && ` · ${p.position}`}</div>
          </div>
        </div>
      </td>
      {showPos && <td className="px-3 py-3 text-center font-mono text-[13px] text-muted2">{p.position}</td>}
      {isC ? (
        <>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-gold">{fmt(p.frv || 0)}</td>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-muted2">{fmt(p.arm_runs || 0)}</td>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-muted2">{fmt(p.block_runs || 0)}</td>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-muted2">{fmt(p.cera_runs || 0)}</td>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-muted2">{fmt(p.drs)}</td>
        </>
      ) : (
        <>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-gold">{(p.oaa >= 0 ? '+' : '') + p.oaa}</td>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-muted2">{fmt(p.arm_runs || 0)}</td>
          <td className="px-3 py-3 text-right font-mono text-[14px] text-muted2">{fmt(p.drs)}</td>
        </>
      )}
      <td className={`px-3 py-3 text-right font-display text-[21px] ${
        p.dwar > 0 ? 'text-gold' : p.dwar < 0 ? 'text-stitch' : 'text-muted2'}`}
      >
        {(p.dwar >= 0 ? '+' : '') + p.dwar}
      </td>
      <td className="px-3 py-3 text-right">
        <span className={`font-display text-[26px] ${scoreCls(p.adj_dscore)}`}>{p.adj_dscore}</span>
      </td>
      <td className="px-3 py-3 w-[60px] pr-3">
        <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: idx * 0.02, ease: [0.34, 1.2, 0.64, 1] }}
            className="h-full rounded-full"
            style={{ background: idx === 0 ? `linear-gradient(90deg, ${team.primary}, #00d4ff)` : '#00d4ff' }}
          />
        </div>
      </td>
    </motion.tr>
  );
}
