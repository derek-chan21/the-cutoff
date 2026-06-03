// ── Position type ────────────────────────────────────────
export type Pos = 'CF' | 'LF' | 'RF' | 'SS' | '2B' | '3B' | '1B' | 'C';

// ── A single player record from dscore_rankings.json ─────
export interface Player {
  rank: number;
  player: string;       // "Last, First"
  team: string;         // e.g. "SF", "NYY"
  position: Pos;
  mlb_id: number | string;
  headshot: string;     // full URL to MLB headshot

  // Core defensive metrics (in runs, vs avg)
  oaa: number;
  drs: number;
  frv: number;

  // Non-catcher runs-based components
  arm_runs: number;
  dp_runs: number;
  rpm_runs?: number;
  rgfp_runs?: number;

  // Catcher-specific
  block_runs?: number;
  cera_runs?: number;
  rsb_runs?: number;
  frp?: number;
  cs_pct?: number;
  cs?: number;
  sb?: number;
  pb?: number;
  wp?: number;

  // Physical tools (from Statcast)
  sprint_speed?: number;       // ft/sec
  hp_to_1b?: number;           // seconds (home plate to first)
  bolts?: number;              // # of 30+ ft/s runs
  pop_time_2b?: number;        // catchers: pop time to 2B
  arm_strength_mph?: number;   // catchers: max-effort arm velocity
  exchange_time?: number;      // catchers: receive→release time
  jump_reaction?: number;      // OF: reaction distance vs avg (ft)
  jump_burst?: number;         // OF: burst distance vs avg (ft)
  jump_route?: number;         // OF: route efficiency vs avg (ft)

  // Prediction model — expected D-Score from physical tools alone
  predicted_dscore?: number;
  dscore_gap?: number;         // actual − predicted (positive = overperformer)

  // Display
  innings: number;
  raw_dscore: number;
  adj_dscore: number;
  dwar: number;
  percentile: number;
  description: string;
}

// ── Baserunner record ────────────────────────────────────
export interface Baserunner {
  rank: number;
  player: string;       // "Last, First"
  team: string;
  mlb_id: number | string;
  headshot: string;
  wbsr: number;         // weighted Base Running runs (FanGraphs)
  sb: number;
  cs: number;
  sb_success: number;   // SB% adjusted with a 3-attempt prior
  spd: number;          // FanGraphs Speed Score
  sprint_speed: number; // Statcast (ft/sec)
  pa: number;
  b_score: number;      // 0-99 composite (wBsR 55 + SB% 25 + Spd 20)
}

// ── Top-level data shape ─────────────────────────────────
export interface RankingsData {
  meta: { generated_at: string; season: number };
  rankings: Record<Pos, Player[]>;
  baserunning_rankings?: Baserunner[];
}
