import io,json,re,time
import pandas as pd
import numpy as np
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pybaseball import (statcast_outs_above_average, statcast_sprint_speed,
                        statcast_catcher_poptime, statcast_outfielder_jump)

CURRENT_YEAR=datetime.now().year
# ─────────────────────────────────────────────────────────────────────────────
# Position-aware D-Score weights — every position uses runs-based components
# from FanGraphs (DRS subcomponents) + Statcast OAA for range.
#
# Non-catcher components (all in runs prevented vs. average):
#   oaa       = Outs Above Average (Statcast)            — range
#   arm_runs  = Arm runs (rARM from DRS)                  — throwing strength/accuracy
#   dp_runs   = Double Play runs (rGDP from DRS)          — DP turn ability
#   drs       = Defensive Runs Saved (overall, BRef)      — catches errors/positioning
#
# Catcher components (all in runs prevented vs. average):
#   frv         = Framing Runs (CFraming)                 — pitch presentation
#   arm_runs    = Throwing FRP (tFRP)                     — caught stealing + pickoffs
#   block_runs  = Blocking FRP (bFRP)                     — wild pitches blocked
#   cera_runs   = Catcher ERA Runs (rCERA)                — game-calling
#   drs         = Defensive Runs Saved (overall)
# ─────────────────────────────────────────────────────────────────────────────
NON_CATCHER_WEIGHTS={
    "CF": {"oaa":0.55,"arm_runs":0.10,"dp_runs":0.00,"drs":0.35},  # all about range
    "LF": {"oaa":0.35,"arm_runs":0.15,"dp_runs":0.00,"drs":0.50},  # easier corner
    "RF": {"oaa":0.35,"arm_runs":0.25,"dp_runs":0.00,"drs":0.40},  # arm matters most
    "SS": {"oaa":0.45,"arm_runs":0.15,"dp_runs":0.10,"drs":0.30},  # range + arm + DP
    "2B": {"oaa":0.40,"arm_runs":0.05,"dp_runs":0.20,"drs":0.35},  # DP turn is key
    "3B": {"oaa":0.40,"arm_runs":0.20,"dp_runs":0.05,"drs":0.35},  # long throw, hot corner
    "1B": {"oaa":0.25,"arm_runs":0.05,"dp_runs":0.05,"drs":0.65},  # mostly errors/scoops
}
CATCHER_WEIGHTS={"frv":0.32,"arm_runs":0.22,"block_runs":0.13,"cera_runs":0.10,"drs":0.23}
# Backward-compat: list of positions we rank
WEIGHTS={k:None for k in list(NON_CATCHER_WEIGHTS.keys())+["C"]}
POSITIONAL_ADJ={"C":8,"SS":7,"CF":5,"2B":3,"3B":2,"RF":0,"LF":-2,"1B":-7}
POS_LABELS={"CF":"center field","SS":"shortstop","C":"catcher","2B":"second base","3B":"third base","RF":"right field","LF":"left field","1B":"first base"}
MLB_ID_OVERRIDES={}

def hs_url(mid):
    if not mid: return ""
    return f"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/{mid}/headshot/67/current"

def to_first_last(name):
    if "," not in name: return name
    last,first=name.split(",",1)
    return f"{first.strip()} {last.strip()}"

def to_last_first(name):
    parts=name.strip().split()
    if len(parts)<=1: return name
    if parts[-1].lower().rstrip(".")in{"jr","sr","ii","iii","iv","v"}:
        last=" ".join(parts[-2:]); first=" ".join(parts[:-2])
    else:
        last=parts[-1]; first=" ".join(parts[:-1])
    return f"{last}, {first}" if first else name

def pull_mlb_ids(year):
    print(f"  Pulling MLB IDs for {year}...")
    try:
        r=requests.get(f"https://statsapi.mlb.com/api/v1/sports/1/players?season={year}",timeout=15)
        people=r.json().get("people",[])
        id_map={" ".join(p["fullName"].split()):p["id"] for p in people if p.get("fullName") and p.get("id")}
        id_map.update(MLB_ID_OVERRIDES)
        print(f"    Got {len(id_map)} player IDs."); return id_map
    except Exception as e:
        print(f"    WARNING: {e}"); return dict(MLB_ID_OVERRIDES)

def pull_fielding_components(year):
    """Pull DRS subcomponents (rARM, rGDP, rPM, rGFP) from FanGraphs for all
    non-catcher positions. These let us isolate arm value, double-play value,
    range, etc. and use them in position-specific weighted D-Score formulas."""
    print(f"  Pulling fielding components (rARM, rGDP) for {year}...")
    fg_positions={'1b':'1B','2b':'2B','3b':'3B','ss':'SS','lf':'LF','cf':'CF','rf':'RF'}
    hdrs={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    all_data=[]
    for fg_pos,our_pos in fg_positions.items():
        try:
            url=(f"https://www.fangraphs.com/api/leaders/major-league/data"
                 f"?pos={fg_pos}&stats=fld&lg=al,nl&qual=0&season={year}&season1={year}"
                 f"&startdate=&enddate=&team=0&pageitems=500&pagenum=1&type=1")
            r=requests.get(url,headers=hdrs,timeout=15)
            rows=json.loads(r.text).get('data',[])
            for p in rows:
                name=re.sub(r'<[^>]+>','',str(p.get('PlayerName','') or '')).strip()
                if not name: continue
                def fnum(k):
                    v=p.get(k,0)
                    try: return float(v) if v not in(None,'') else 0.0
                    except: return 0.0
                all_data.append({
                    'player_name':to_last_first(name),
                    'position':our_pos,
                    'fg_inn':fnum('Inn'),
                    'arm_runs':round(fnum('rARM'),2),   # Arm runs (DRS component)
                    'dp_runs':round(fnum('rGDP'),2),    # Double Play runs (DRS component)
                    'rpm_runs':round(fnum('rPM'),2),    # Plus/minus range runs
                    'rgfp_runs':round(fnum('rGFP'),2),  # Good fielding plays runs
                })
            time.sleep(0.5)  # be nice to FanGraphs
        except Exception as e:
            print(f"    FG {fg_pos} failed: {e}")
    df=pd.DataFrame(all_data)
    if df.empty:
        print("    WARNING: No fielding components retrieved.")
        return df
    # Deduplicate by (name, position) keeping max-innings row
    df=df.sort_values('fg_inn',ascending=False).drop_duplicates(subset=['player_name','position'],keep='first')
    print(f"    Got {len(df)} fielding records across 7 positions.")
    return df

def pull_sprint_speed(year):
    """Statcast sprint speed (ft/sec), HP-to-1B time, bolt count. All non-pitchers."""
    print(f"  Pulling sprint speed for {year}...")
    try:
        df = statcast_sprint_speed(year)
        if df is None or df.empty:
            return pd.DataFrame()
        df = df.rename(columns={'last_name, first_name': 'player_name'})
        df['player_name'] = df['player_name'].astype(str).str.strip()
        keep = df[['player_name', 'sprint_speed', 'hp_to_1b', 'bolts']].copy()
        keep['sprint_speed'] = pd.to_numeric(keep['sprint_speed'], errors='coerce').fillna(0)
        keep['hp_to_1b']     = pd.to_numeric(keep['hp_to_1b'], errors='coerce').fillna(0)
        keep['bolts']        = pd.to_numeric(keep['bolts'], errors='coerce').fillna(0)
        print(f"    Got {len(keep)} sprint speed entries.")
        return keep
    except Exception as e:
        print(f"    WARNING (sprint speed): {e}")
        return pd.DataFrame()

def pull_outfielder_jump(year):
    """Statcast outfielder jump: reaction / burst / route distances (vs avg)."""
    print(f"  Pulling outfielder jump for {year}...")
    try:
        df = statcast_outfielder_jump(year)
        if df is None or df.empty:
            return pd.DataFrame()
        df = df.rename(columns={
            'last_name, first_name': 'player_name',
            'rel_league_reaction_distance': 'jump_reaction',
            'rel_league_burst_distance':    'jump_burst',
            'rel_league_routing_distance':  'jump_route',
        })
        df['player_name'] = df['player_name'].astype(str).str.strip()
        keep = df[['player_name', 'jump_reaction', 'jump_burst', 'jump_route']].copy()
        for col in ['jump_reaction', 'jump_burst', 'jump_route']:
            keep[col] = pd.to_numeric(keep[col], errors='coerce').fillna(0)
        print(f"    Got {len(keep)} outfielder jump entries.")
        return keep
    except Exception as e:
        print(f"    WARNING (outfielder jump): {e}")
        return pd.DataFrame()

def pull_catcher_poptime_data(year):
    """Statcast catcher pop time + arm strength (mph) + exchange time."""
    print(f"  Pulling catcher pop time / arm strength for {year}...")
    try:
        df = statcast_catcher_poptime(year)
        if df is None or df.empty:
            return pd.DataFrame()
        df = df.rename(columns={
            'entity_name': 'player_name',
            'pop_2b_sba': 'pop_time_2b',
            'maxeff_arm_2b_3b_sba': 'arm_strength_mph',
            'exchange_2b_3b_sba': 'exchange_time',
        })
        df['player_name'] = df['player_name'].astype(str).str.strip()
        keep = df[['player_name', 'pop_time_2b', 'arm_strength_mph', 'exchange_time']].copy()
        for col in ['pop_time_2b', 'arm_strength_mph', 'exchange_time']:
            keep[col] = pd.to_numeric(keep[col], errors='coerce').fillna(0)
        print(f"    Got {len(keep)} catcher pop time entries.")
        return keep
    except Exception as e:
        print(f"    WARNING (pop time): {e}")
        return pd.DataFrame()

def pull_catcher_stats(year):
    """Pull comprehensive catcher defensive metrics from FanGraphs — all components in runs.
    Returns: frv (framing), arm_runs (throwing), block_runs (blocking), cera_runs (game-calling),
    fg_drs (DRS), frp (total Fielding Runs Prevented), plus raw counts (cs, sb, pb, wp)."""
    print(f"  Pulling catcher defensive stats for {year}...")
    try:
        url=(f"https://www.fangraphs.com/api/leaders/major-league/data"
             f"?pos=c&stats=fld&lg=al,nl&qual=0&season={year}&season1={year}"
             f"&startdate=&enddate=&team=0&pageitems=500&pagenum=1&type=c")
        hdrs={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
        r=requests.get(url,headers=hdrs,timeout=15)
        rows=json.loads(r.text).get("data",[])
        if not rows:
            print("    WARNING: FanGraphs returned no catcher rows.")
            return pd.DataFrame()
        result=[]
        for p in rows:
            raw=p.get("PlayerName","") or re.sub(r"<[^>]+>","",p.get("Name","")).strip()
            name=re.sub(r"<[^>]+>","",str(raw)).strip()
            if not name: continue
            team=re.sub(r"<[^>]+>","",str(p.get("TeamNameAbb","") or "")).strip()
            def fnum(k,default=0):
                v=p.get(k,default)
                try: return float(v) if v not in(None,"") else 0.0
                except: return 0.0
            result.append({
                "player_name":to_last_first(name),
                "team":team if team and team!="- - -" else "",
                "position":"C",
                "innings":fnum("Inn"),
                "games":int(fnum("G")),
                # Runs-based defensive components (all in runs prevented vs avg)
                "frv":round(fnum("CFraming"),2),      # Framing Runs Value
                "arm_runs":round(fnum("tFRP"),2),      # Throwing FRP (arm/CS)
                "block_runs":round(fnum("bFRP"),2),    # Blocking FRP (wild pitches blocked)
                "cera_runs":round(fnum("rCERA"),2),    # Game-calling (effect on staff ERA)
                "rsb_runs":round(fnum("rSB"),2),       # SB runs prevented (alt arm metric)
                "drs":round(fnum("DRS"),1),            # Defensive Runs Saved
                "frp":round(fnum("FRP"),2),            # Total Fielding Runs Prevented
                "defense":round(fnum("Defense"),2),    # FG total defensive value
                # Raw counts for display
                "cs":int(fnum("CS")),
                "sb":int(fnum("SB")),
                "pb":int(fnum("PB")),
                "wp":int(fnum("WP")),
                # Filler for non-catcher fields
                "oaa":0.0,
            })
        df=pd.DataFrame(result)
        # Compute CS% from raw counts (for display only; formula uses arm_runs)
        df["cs_pct_bref"]=(df["cs"]/(df["cs"]+df["sb"]).clip(lower=1)*100).round(1)
        print(f"    Got {len(df)} catcher records from FanGraphs (FRV+ARM+BLK+CERA+DRS).")
        return df
    except Exception as e:
        print(f"    FanGraphs catcher stats failed: {e}")
        return pd.DataFrame()

def pull_oaa(year):
    print(f"  Pulling OAA for {year}...")
    try:
        oaa=statcast_outs_above_average(year,pos="all")
        nc=next((c for c in oaa.columns if "name" in c.lower()),None)
        pc=next((c for c in oaa.columns if "pos" in c.lower()),None)
        tc=next((c for c in oaa.columns if "team" in c.lower()),None)
        oc=next((c for c in oaa.columns if "outs_above" in c.lower() or c.lower()=="oaa"),None)
        if not nc or not oc: return pd.DataFrame(columns=["player_name","position","team","oaa"])
        oaa=oaa.rename(columns={nc:"player_name",oc:"oaa"})
        if pc: oaa=oaa.rename(columns={pc:"position"})
        else: oaa["position"]="Unknown"
        if tc: oaa=oaa.rename(columns={tc:"team"})
        else: oaa["team"]=""
        oaa=oaa[["player_name","position","team","oaa"]].copy()
        oaa["player_name"]=oaa["player_name"].str.strip()
        oaa["oaa"]=pd.to_numeric(oaa["oaa"],errors="coerce").fillna(0)
        print(f"    Got {len(oaa)} players."); return oaa
    except Exception as e:
        print(f"    WARNING: {e}"); return pd.DataFrame(columns=["player_name","position","team","oaa"])

BREF_POS={"2":"C","3":"1B","4":"2B","5":"3B","6":"SS","7":"LF","8":"CF","9":"RF"}

def pull_drs(year):
    """Pull DRS + catcher-specific stats (CS, SB, PB) from Baseball Reference."""
    print(f"  Pulling DRS for {year}...")
    try:
        url=f"https://www.baseball-reference.com/leagues/majors/{year}-standard-fielding.shtml"
        headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
        r=requests.get(url,headers=headers,timeout=15)
        soup=BeautifulSoup(r.content,"html.parser")
        table=soup.find("table",{"id":"players_standard_fielding"})
        if not table: return pd.DataFrame(columns=["player_name","position","team","drs","innings","cs","sb","pb"])
        rows=[]
        for tr in table.find("tbody").find_all("tr"):
            if "thead" in (tr.get("class") or []): continue
            def cell(stat,tr=tr): return tr.find(attrs={"data-stat":stat})
            name_td=cell("name_display")
            if not name_td: continue
            name=re.sub(r"[*#]","",name_td.get_text(strip=True)).strip()
            if not name: continue
            pos_td=cell("pos")
            raw_pos=pos_td.get_text(strip=True) if pos_td else ""
            m=re.search(r"\d",raw_pos)
            pos=BREF_POS.get(m.group(),"") if m else ""
            if not pos: continue
            team_td=cell("team_name_abbr")
            team=team_td.get_text(strip=True) if team_td else ""
            drs_td=cell("f_drs_total")
            drs_text=drs_td.get_text(strip=True) if drs_td else ""
            drs=float(drs_text) if drs_text else 0.0
            inn_td=cell("f_innings")
            innings=float(inn_td.get("csk",0))/3 if inn_td and inn_td.get("csk") else 0.0
            # Catcher-specific columns — all have _catcher_only suffix in BRef HTML
            def safe_float(td):
                if not td: return 0.0
                t=td.get_text(strip=True)
                try: return float(t)
                except: return 0.0
            cs=safe_float(cell("f_cs_catcher_only"))
            sb=safe_float(cell("f_sb_catcher_only"))
            pb=safe_float(cell("f_pb_catcher_only"))
            cs_pct_bref=safe_float(cell("f_cs_perc_catcher_only"))  # pre-computed CS%
            rows.append({"player_name":name,"position":pos,"team":team,"drs":drs,"innings":innings,"cs":cs,"sb":sb,"pb":pb,"cs_pct_bref":cs_pct_bref})
        if not rows: return pd.DataFrame(columns=["player_name","position","team","drs","innings","cs","sb","pb","cs_pct_bref"])
        df=pd.DataFrame(rows)
        for col in ["drs","innings","cs","sb","pb","cs_pct_bref"]:
            df[col]=pd.to_numeric(df[col],errors="coerce").fillna(0)
        print(f"    Got {len(df)} rows with DRS data."); return df
    except Exception as e:
        print(f"    WARNING: {e}"); return pd.DataFrame(columns=["player_name","position","team","drs","innings","cs","sb","pb"])

def normalize(df,col):
    result=pd.Series(index=df.index,dtype=float)
    for pos,group in df.groupby("position"):
        mn,mx=group[col].min(),group[col].max()
        result.loc[group.index]=50.0 if mx==mn else((group[col]-mn)/(mx-mn)*100)
    return result.round(1)

def _norm_within(series):
    """Normalize a series 0-100. If all values equal, return 50s."""
    mn,mx=series.min(),series.max()
    if mx==mn: return pd.Series(50.0,index=series.index)
    return ((series-mn)/(mx-mn)*100).round(1)

def compute(merged):
    merged["raw_dscore"]=0.0; merged["adj_dscore"]=0.0; merged["dwar"]=0.0
    # ── Non-catcher positions: position-specific weighted formula ──
    # Components: OAA (range), arm_runs (rARM), dp_runs (rGDP), DRS (overall)
    for pos,weights in NON_CATCHER_WEIGHTS.items():
        mask=merged["position"]==pos
        if mask.sum()==0: continue
        # Normalize each component within this position pool
        norms={}
        for key,col in [("oaa","oaa"),("arm_runs","arm_runs"),("dp_runs","dp_runs"),("drs","drs")]:
            if col in merged.columns:
                norms[key]=_norm_within(merged.loc[mask,col])
            else:
                norms[key]=pd.Series(50.0,index=merged.loc[mask].index)
        raw=sum(norms[k]*weights[k] for k in weights)
        adj=(raw+POSITIONAL_ADJ.get(pos,0)).clip(0,99)
        merged.loc[mask,"raw_dscore"]=raw.round(1)
        merged.loc[mask,"adj_dscore"]=adj.round(1)
        # D-WAR: derived from total runs (OAA + arm + dp + 0.5*DRS to avoid double-count)
        # If component-runs are unavailable, fall back to adj-based estimate.
        for idx in merged[mask].index:
            total_runs=(float(merged.loc[idx,"oaa"])*0.6  # OAA in outs, ~0.6 runs/out
                       +float(merged.loc[idx,"arm_runs"])
                       +float(merged.loc[idx,"dp_runs"])
                       +float(merged.loc[idx,"drs"])*0.5)  # half-weight DRS (overlaps)
            if abs(total_runs)<0.01:
                inn=float(merged.loc[idx,"innings"]) if "innings" in merged.columns else 0
                runs=(float(adj.loc[idx])-50)*0.4
                if inn>0: runs=runs*min(1.0,inn/1350)
                merged.loc[idx,"dwar"]=round(runs/9.5,2)
            else:
                merged.loc[idx,"dwar"]=round(total_runs/9.5,2)
    # Catcher-specific formula — uses runs-based components from FanGraphs.
    # Each component normalized within catchers, then weighted-summed.
    c_mask=merged["position"]=="C"
    if c_mask.sum()>0:
        # Normalize each runs-based metric within catchers (0-100 scale)
        c_norms={}
        for k in ["frv","arm_runs","block_runs","cera_runs","drs"]:
            if k in merged.columns:
                series=merged.loc[c_mask,k]
                mn,mx=series.min(),series.max()
                c_norms[k]=pd.Series(50.0,index=series.index) if mx==mn else ((series-mn)/(mx-mn)*100).round(1)
            else:
                c_norms[k]=pd.Series(50.0,index=merged.loc[c_mask].index)
        # Weighted sum of normalized components
        raw=sum(c_norms[k]*CATCHER_WEIGHTS[k] for k in CATCHER_WEIGHTS if k in c_norms)
        adj=(raw+POSITIONAL_ADJ["C"]).clip(0,99)
        merged.loc[c_mask,"raw_dscore"]=raw.round(1)
        merged.loc[c_mask,"adj_dscore"]=adj.round(1)
        # Compute D-WAR from total runs (FRP) directly — more accurate for catchers
        # FRP is already in runs; D-WAR = runs / 9.5 runs-per-win
        for idx in merged[c_mask].index:
            frp=float(merged.loc[idx,"frp"]) if "frp" in merged.columns else 0
            # If FRP not available, fall back to adj-based estimate
            if abs(frp)<0.01:
                inn=float(merged.loc[idx,"innings"]) if "innings" in merged.columns else 0
                runs=(float(adj.loc[idx])-50)*0.4
                if inn>0: runs=runs*min(1.0,inn/1350)
                merged.loc[idx,"dwar"]=round(runs/9.5,2)
            else:
                merged.loc[idx,"dwar"]=round(frp/9.5,2)
    return merged

def gen_desc_catcher(p,pct,total):
    name=p["player"].split(",")[0]
    frv=p.get("frv",0); arm=p.get("arm_runs",0); blk=p.get("block_runs",0)
    cera=p.get("cera_runs",0); drs=p.get("drs",0); cs_pct=p.get("cs_pct",0)
    dwar=p["dwar"]; adj=p["adj_dscore"]; rank=p["rank"]
    tier="elite" if pct>=90 else "above-average" if pct>=75 else "average" if pct>=50 else "below-average"
    def desc(val,label,unit="runs"):
        if val>=4: return f"elite {label} (+{val:.1f} {unit})"
        if val>=1.5: return f"above-average {label} (+{val:.1f} {unit})"
        if val>=-1.5: return f"average {label} ({'+' if val>=0 else ''}{val:.1f} {unit})"
        return f"below-average {label} ({val:.1f} {unit})"
    parts=[f"{name} ranks #{rank} among {total} qualified catchers in 2026, posting a {tier} D-Score of {adj} — placing him in the {pct}th percentile."]
    components=[]
    if frv!=0: components.append(desc(frv,"framing"))
    if arm!=0: components.append(desc(arm,"throwing"))
    if blk!=0: components.append(desc(blk,"blocking"))
    if cera!=0: components.append(desc(cera,"game-calling"))
    if components:
        parts.append("The Cutoff credits him with "+", ".join(components[:-1])+(f", and {components[-1]}" if len(components)>1 else components[-1])+".")
    if cs_pct>0:
        if cs_pct>=36: parts.append(f"He has thrown out {cs_pct:.0f}% of attempted base-stealers — elite arm strength.")
        elif cs_pct>=28: parts.append(f"His {cs_pct:.0f}% caught-stealing rate is above league average.")
        else: parts.append(f"His {cs_pct:.0f}% caught-stealing rate is near league average.")
    if dwar>=2: parts.append(f"His {dwar}+ D-WAR ranks among the most valuable defensive catchers in baseball.")
    elif dwar>=1: parts.append(f"His {dwar} D-WAR represents meaningful value above replacement.")
    else: parts.append(f"His {dwar} D-WAR sits near replacement level.")
    return " ".join(parts)

def gen_desc(p,pct,total,pos):
    if pos=="C": return gen_desc_catcher(p,pct,total)
    name=p["player"].split(",")[0]
    oaa=p["oaa"]; drs=p["drs"]; adj=p["adj_dscore"]; dwar=p["dwar"]; rank=p["rank"]
    has_drs=drs!=0
    tier="elite" if pct>=90 else "above-average" if pct>=75 else "average" if pct>=50 else "below-average"
    oaa_d=(f"exceptional range (+{oaa} OAA)" if oaa>=15 else f"above-average range (+{oaa} OAA)" if oaa>=8 else f"solid range (+{oaa} OAA)" if oaa>=3 else f"average range ({oaa} OAA)" if oaa>=0 else f"below-average range ({oaa} OAA)")
    war_d=(f"His {dwar}+ D-WAR ranks among the best defensive values in baseball." if dwar>=2 else f"His {dwar} D-WAR represents meaningful value above replacement." if dwar>=1 else f"His {dwar} D-WAR sits near replacement level.")
    drs_n=(f"DRS ({'+' if drs>=0 else ''}{drs}) confirms the picture." if has_drs and abs(oaa-drs)<=5 else f"DRS ({'+' if drs>=0 else ''}{drs}) rates him lower, suggesting range is the primary separator." if has_drs and oaa>drs else f"DRS ({'+' if drs>=0 else ''}{drs}) rates him higher, indicating contributions beyond range." if has_drs else "DRS data is pending for the early 2026 season.")
    return f"{name} ranks #{rank} among {total} qualified {POS_LABELS.get(pos,pos)}s in 2026, posting a {tier} D-Score of {adj} — placing him in the {pct}th percentile. The Cutoff credits him with {oaa_d}. {drs_n} {war_d}"

def run_pipeline(year=CURRENT_YEAR):
    print(f"\nThe Cutoff — Pipeline — {year}\n"+"="*40)
    id_map=pull_mlb_ids(year)
    oaa_df=pull_oaa(year)
    time.sleep(3)
    drs_df=pull_drs(year)
    time.sleep(3)
    fielding_df=pull_fielding_components(year)
    time.sleep(2)
    catcher_df=pull_catcher_stats(year)
    time.sleep(2)
    sprint_df=pull_sprint_speed(year)
    time.sleep(2)
    poptime_df=pull_catcher_poptime_data(year)
    time.sleep(2)
    jump_df=pull_outfielder_jump(year)

    pm={"CF":"CF","LF":"LF","RF":"RF","SS":"SS","2B":"2B","3B":"3B","1B":"1B","C":"C","C-1B":"C","MI":"SS","OF":"CF"}
    if not oaa_df.empty: oaa_df["position"]=oaa_df["position"].map(pm).fillna(oaa_df["position"])
    if not drs_df.empty: drs_df["player_name"]=drs_df["player_name"].apply(to_last_first)
    if oaa_df.empty and drs_df.empty and catcher_df.empty:
        print("ERROR: No data from any source."); return

    # ── Build non-catcher merged dataframe (OAA + DRS from BRef) ──
    if oaa_df.empty:
        merged=drs_df.copy(); merged["oaa"]=0.0
    elif drs_df.empty:
        merged=oaa_df.copy()
        for col in ["drs","innings","cs","sb","pb"]: merged[col]=0.0
    else:
        drs_cols=["player_name","position","drs","innings","cs","sb","pb","cs_pct_bref"]
        drs_cols=[c for c in drs_cols if c in drs_df.columns]
        merged=pd.merge(oaa_df,drs_df[drs_cols],on=["player_name","position"],how="left")
        for col in ["drs","innings","cs","sb","pb","cs_pct_bref"]:
            if col not in merged.columns: merged[col]=0.0
            else: merged[col]=merged[col].fillna(0)

    # Drop any catchers that snuck in via OAA (shouldn't happen, but safety)
    merged=merged[merged["position"]!="C"].copy()
    # Initialize catcher-specific columns (will be 0 for non-catchers)
    for col in ["frv","block_runs","cera_runs","rsb_runs","frp","defense","wp"]:
        if col not in merged.columns: merged[col]=0.0
    # Initialize fielding components (will be filled by FanGraphs merge below)
    for col in ["arm_runs","dp_runs","rpm_runs","rgfp_runs"]:
        if col not in merged.columns: merged[col]=0.0

    # ── Merge FanGraphs fielding components for non-catchers ──
    if not fielding_df.empty:
        # Drop dup columns from merged before merging in FanGraphs values
        merged=merged.drop(columns=[c for c in ["arm_runs","dp_runs","rpm_runs","rgfp_runs"] if c in merged.columns])
        merged=pd.merge(merged,fielding_df[["player_name","position","fg_inn","arm_runs","dp_runs","rpm_runs","rgfp_runs"]],
                       on=["player_name","position"],how="left")
        for col in ["arm_runs","dp_runs","rpm_runs","rgfp_runs","fg_inn"]:
            merged[col]=merged[col].fillna(0)
        # Backfill innings from FanGraphs when BRef didn't have the player
        if "innings" in merged.columns:
            merged["innings"]=merged.apply(
                lambda r: r["fg_inn"] if (r.get("innings",0) or 0)<10 and r["fg_inn"]>0 else r["innings"],
                axis=1
            )
        merged=merged.drop(columns=["fg_inn"])

    # ── Catcher data from FanGraphs (comprehensive, runs-based) ──
    if not catcher_df.empty:
        # Dynamic threshold ~ Baseball Savant "qualified": 3 innings per team game
        per_team_inn=catcher_df.groupby("team")["innings"].sum()
        per_team_inn=per_team_inn[per_team_inn.index!=""]  # exclude blank team
        games_played=int(round((per_team_inn/9).median())) if not per_team_inn.empty else 50
        C_MIN_INN=max(30,games_played*3)
        # NOTE: FanGraphs combines traded-player rows under "2 Tms" team — keep them
        qualified=catcher_df[catcher_df["innings"]>=C_MIN_INN].copy()
        print(f"    Team games (median): {games_played} → catcher threshold: ≥{C_MIN_INN} inn")
        print(f"    Catcher filter: {len(catcher_df)} FanGraphs rows → {len(qualified)} qualified")
        # Add to merged dataframe (FanGraphs provides everything we need for catchers)
        for col in merged.columns:
            if col not in qualified.columns: qualified[col]=0.0 if col not in("player_name","team","position") else ""
        merged=pd.concat([merged,qualified[merged.columns]],ignore_index=True)
        print(f"    Added {len(qualified)} catchers from FanGraphs.")

    if "innings" not in merged.columns: merged["innings"]=0.0
    merged=merged[merged["position"].isin(WEIGHTS.keys())].copy()
    if merged.empty: print("ERROR: No players."); return

    # ── Merge physical tools ──
    for col in ["sprint_speed","hp_to_1b","bolts","pop_time_2b","arm_strength_mph",
                "exchange_time","jump_reaction","jump_burst","jump_route"]:
        if col not in merged.columns: merged[col]=0.0
    if not sprint_df.empty:
        merged=pd.merge(merged,sprint_df.rename(columns={
            "sprint_speed":"_ss","hp_to_1b":"_hp","bolts":"_bolts"
        }),on="player_name",how="left")
        merged["sprint_speed"]=merged["_ss"].fillna(0); merged["hp_to_1b"]=merged["_hp"].fillna(0); merged["bolts"]=merged["_bolts"].fillna(0)
        merged=merged.drop(columns=["_ss","_hp","_bolts"])
    if not poptime_df.empty:
        merged=pd.merge(merged,poptime_df.rename(columns={
            "pop_time_2b":"_pt","arm_strength_mph":"_arm","exchange_time":"_ex"
        }),on="player_name",how="left")
        merged["pop_time_2b"]=merged["_pt"].fillna(0); merged["arm_strength_mph"]=merged["_arm"].fillna(0); merged["exchange_time"]=merged["_ex"].fillna(0)
        merged=merged.drop(columns=["_pt","_arm","_ex"])
    if not jump_df.empty:
        merged=pd.merge(merged,jump_df.rename(columns={
            "jump_reaction":"_jr","jump_burst":"_jb","jump_route":"_jx"
        }),on="player_name",how="left")
        merged["jump_reaction"]=merged["_jr"].fillna(0); merged["jump_burst"]=merged["_jb"].fillna(0); merged["jump_route"]=merged["_jx"].fillna(0)
        merged=merged.drop(columns=["_jr","_jb","_jx"])

    # compute() handles all normalization internally within each position pool

    merged=compute(merged)

    # ── PREDICTION MODEL ─────────────────────────────────────────
    # Predicts a player's D-Score from their PHYSICAL TOOLS ALONE
    # (sprint speed, arm strength, pop time, OF jump, etc. + position).
    # The residual (actual D-Score − predicted D-Score) tells us who is
    # over-/under-performing what their athletic measurements would imply.
    #
    # Uses out-of-fold predictions (5-fold CV) so each player's score
    # comes from a model that didn't train on them — prevents the
    # "I'll perfectly predict myself" overfitting trap.
    try:
        from sklearn.linear_model import Ridge
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import cross_val_predict
        from sklearn.pipeline import Pipeline

        # Features = physical tools + position one-hot (no defensive results here!)
        TOOL_COLS=["sprint_speed","hp_to_1b","bolts","pop_time_2b","arm_strength_mph",
                   "exchange_time","jump_reaction","jump_burst","jump_route","innings"]
        pos_dummies=pd.get_dummies(merged["position"],prefix="pos")
        X=pd.concat([merged[TOOL_COLS].astype(float),pos_dummies.astype(float)],axis=1).fillna(0).values
        y=merged["adj_dscore"].astype(float).values

        model=Pipeline([("scaler",StandardScaler()),("ridge",Ridge(alpha=2.0))])
        # Out-of-fold predictions so each player's predicted score is honest
        if len(merged)>=10:
            y_pred=cross_val_predict(model,X,y,cv=5)
            y_pred=np.clip(y_pred,0,99)
            merged["predicted_dscore"]=np.round(y_pred,1)
            merged["dscore_gap"]=np.round(y-y_pred,1)
            print(f"  Prediction model: trained on {len(merged)} players "
                  f"(corr={np.corrcoef(y,y_pred)[0,1]:.3f})")
        else:
            merged["predicted_dscore"]=merged["adj_dscore"]
            merged["dscore_gap"]=0.0
    except Exception as e:
        print(f"  Prediction model SKIPPED: {e}")
        merged["predicted_dscore"]=merged["adj_dscore"]
        merged["dscore_gap"]=0.0

    rankings={}
    for pos in WEIGHTS:
        pos_df=merged[merged["position"]==pos].sort_values("adj_dscore",ascending=False).reset_index(drop=True)
        total=len(pos_df); entries=[]
        for i,r in pos_df.iterrows():
            rank=i+1; pct=round(((total-rank+1)/total)*100)
            mid=id_map.get(to_first_last(r["player_name"]),"") or id_map.get(r["player_name"],"")
            # Compute CS% from raw counts (or use FanGraphs/BRef pre-computed)
            cs_v=float(r.get("cs",0)); sb_v=float(r.get("sb",0))
            arm_val_pct=round(cs_v/max(cs_v+sb_v,1)*100,1) if (cs_v+sb_v)>0 else round(float(r.get("cs_pct_bref",0)),1)
            e={"rank":rank,"player":r["player_name"],"team":r.get("team",""),
               "position":pos,"mlb_id":mid,"headshot":hs_url(mid),
               "oaa":round(float(r["oaa"]),1),"drs":round(float(r["drs"]),1),
               "frv":round(float(r.get("frv",0)),2),
               # Catcher runs-based metrics (0 for non-catchers)
               "arm_runs":round(float(r.get("arm_runs",0)),2),
               "block_runs":round(float(r.get("block_runs",0)),2),
               "cera_runs":round(float(r.get("cera_runs",0)),2),
               "rsb_runs":round(float(r.get("rsb_runs",0)),2),
               "frp":round(float(r.get("frp",0)),2),
               # Raw counts
               "cs_pct":arm_val_pct,"cs":int(round(float(r.get("cs",0)))),
               "sb":int(round(float(r.get("sb",0)))),"pb":int(round(float(r.get("pb",0)))),
               "wp":int(round(float(r.get("wp",0)))),
               # Non-catcher DRS subcomponents (0 for catchers — they use frp/etc instead)
               "dp_runs":round(float(r.get("dp_runs",0)),2),
               "rpm_runs":round(float(r.get("rpm_runs",0)),2),
               "rgfp_runs":round(float(r.get("rgfp_runs",0)),2),
               "innings":round(float(r.get("innings",0))),
               # Physical tools (from Statcast)
               "sprint_speed":round(float(r.get("sprint_speed",0)),1),
               "hp_to_1b":round(float(r.get("hp_to_1b",0)),2),
               "bolts":int(round(float(r.get("bolts",0)))),
               "pop_time_2b":round(float(r.get("pop_time_2b",0)),2),
               "arm_strength_mph":round(float(r.get("arm_strength_mph",0)),1),
               "exchange_time":round(float(r.get("exchange_time",0)),2),
               "jump_reaction":round(float(r.get("jump_reaction",0)),2),
               "jump_burst":round(float(r.get("jump_burst",0)),2),
               "jump_route":round(float(r.get("jump_route",0)),2),
               # Prediction-model: expected D-Score from physical tools alone
               "predicted_dscore":round(float(r.get("predicted_dscore",0)),1),
               "dscore_gap":round(float(r.get("dscore_gap",0)),1),
               "raw_dscore":round(float(r["raw_dscore"]),1),
               "adj_dscore":round(float(r["adj_dscore"]),1),
               "dwar":round(float(r["dwar"]),2),
               "percentile":pct,"description":""}
            entries.append(e)
        for e in entries: e["description"]=gen_desc(e,e["percentile"],total,pos)
        rankings[pos]=entries

    all_p=[p for pl in rankings.values() for p in pl]
    dwar_l=sorted(all_p,key=lambda x:x["dwar"],reverse=True)[:30]
    output={"meta":{"generated_at":datetime.utcnow().isoformat()+"Z","season":year},"rankings":rankings,"dwar_leaders":dwar_l}
    import os; script_dir=os.path.dirname(os.path.abspath(__file__))
    site_dir=os.path.join(script_dir,"dscore-site")
    app_public=os.path.join(script_dir,"dscore-app","public")
    out_paths=[os.path.join(script_dir,"dscore_rankings.json")]
    if os.path.isdir(site_dir): out_paths.append(os.path.join(site_dir,"dscore_rankings.json"))
    if os.path.isdir(app_public): out_paths.append(os.path.join(app_public,"dscore_rankings.json"))
    for p in out_paths:
        with open(p,"w") as f: json.dump(output,f,indent=2)
    total_p=sum(len(v) for v in rankings.values())
    hs_count=sum(1 for p in all_p if p["headshot"])
    c_count=len(rankings.get("C",[]))
    frv_count=sum(1 for p in rankings.get("C",[]) if p.get("frv",0)!=0)
    print(f"\n  Saved dscore_rankings.json — {total_p} players")
    print(f"  Headshots: {hs_count} players")
    print(f"  Catchers: {c_count} qualified ({frv_count} with FRV data)")
    if dwar_l: print(f"  D-WAR leader: {dwar_l[0]['player']} ({dwar_l[0]['dwar']} D-WAR)")
    print("\nDone.")

if __name__=="__main__":
    run_pipeline()
