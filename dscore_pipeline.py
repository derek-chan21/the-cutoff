import io,json,re,time
import pandas as pd
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pybaseball import statcast_outs_above_average

CURRENT_YEAR=datetime.now().year
# Non-catcher weights: (OAA, DRS, FRV)
WEIGHTS={"CF":(0.50,0.30,0.20),"LF":(0.35,0.40,0.25),"RF":(0.35,0.40,0.25),"SS":(0.45,0.35,0.20),"2B":(0.40,0.38,0.22),"3B":(0.35,0.40,0.25),"1B":(0.20,0.50,0.30),"C":(0.00,0.35,0.65)}
# Catcher-specific weights: FRV (framing), DRS, ARM (CS%), BLOCK (inverted PB rate)
CATCHER_WEIGHTS={"frv":0.40,"drs":0.25,"arm":0.20,"block":0.15}
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

def pull_catcher_framing(year):
    """Pull FRV (Framing Runs Value) for catchers from Baseball Savant via pybaseball or direct scrape."""
    print(f"  Pulling catcher framing (FRV) for {year}...")
    # Try pybaseball first
    try:
        from pybaseball import statcast_catcher_framing
        df=statcast_catcher_framing(year,year)
        if df is not None and not df.empty:
            if "last_name" in df.columns and "first_name" in df.columns:
                df["player_name"]=df["last_name"].str.strip()+", "+df["first_name"].str.strip()
            else:
                nc=next((c for c in df.columns if "name" in c.lower()),None)
                if not nc: raise ValueError(f"No name col. Cols:{list(df.columns)}")
                df["player_name"]=df[nc].apply(lambda x:to_last_first(str(x).strip()) if "," not in str(x) else str(x).strip())
            frv_col=next((c for c in df.columns if "extra_strikes" in c.lower() or c.lower() in("frv","framing_runs","framing_run_value")),None)
            if not frv_col: raise ValueError(f"No FRV col. Cols:{list(df.columns)}")
            df["frv"]=pd.to_numeric(df[frv_col],errors="coerce").fillna(0)
            result=df[["player_name","frv"]].copy()
            print(f"    Got {len(result)} framing entries (pybaseball)."); return result
    except ImportError:
        print("    pybaseball statcast_catcher_framing not found, trying direct scrape.")
    except Exception as e:
        print(f"    pybaseball framing failed: {e}")
    # Fallback: scrape Baseball Savant catcher framing page
    try:
        url=f"https://baseballsavant.mlb.com/catcher_framing?year={year}&team=&min=q&sort=4,1"
        hdrs={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        r=requests.get(url,headers=hdrs,timeout=20)
        soup=BeautifulSoup(r.content,"html.parser")
        for script in soup.find_all("script"):
            text=script.string or ""
            if "runs_extra_strikes" not in text: continue
            m=re.search(r'(\[\s*\{[^<]{50,}\}])',text,re.DOTALL)
            if not m: continue
            try:
                data=json.loads(m.group(1))
                rows=[]
                for item in data:
                    if not isinstance(item,dict) or "runs_extra_strikes" not in item: continue
                    last=str(item.get("last_name","")).strip()
                    first=str(item.get("first_name","")).strip()
                    if not last: continue
                    name=f"{last}, {first}" if first else last
                    frv=float(item.get("runs_extra_strikes",0))
                    rows.append({"player_name":name,"frv":frv})
                if rows:
                    df=pd.DataFrame(rows)
                    print(f"    Got {len(df)} framing entries (savant JSON)."); return df
            except Exception: pass
        table=soup.find("table")
        if table:
            rows=[]
            for tr in table.find("tbody").find_all("tr"):
                tds=tr.find_all(["td","th"])
                if len(tds)<5: continue
                name_td=tr.find(attrs={"data-col":"player_name"}) or (tds[1] if len(tds)>1 else None)
                if not name_td: continue
                name=name_td.get_text(strip=True)
                if not name: continue
                frv_td=tr.find(attrs={"data-col":"runs_extra_strikes"})
                if frv_td:
                    try:
                        frv=float(frv_td.get_text(strip=True))
                        rows.append({"player_name":to_last_first(name),"frv":frv})
                    except: pass
            if rows:
                df=pd.DataFrame(rows)
                print(f"    Got {len(df)} framing entries (savant HTML)."); return df
        print("    WARNING: Could not parse Baseball Savant framing page.")
    except Exception as e:
        print(f"    WARNING (savant scrape): {e}")
    print("    Catcher framing unavailable — will use DRS-only for catchers.")
    return pd.DataFrame(columns=["player_name","frv"])

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
            # Catcher-specific columns (0 for non-catchers naturally)
            def safe_float(td):
                if not td: return 0.0
                t=td.get_text(strip=True)
                try: return float(t)
                except: return 0.0
            cs=safe_float(cell("f_cs"))
            sb=safe_float(cell("f_sb"))
            pb=safe_float(cell("f_pb"))
            rows.append({"player_name":name,"position":pos,"team":team,"drs":drs,"innings":innings,"cs":cs,"sb":sb,"pb":pb})
        if not rows: return pd.DataFrame(columns=["player_name","position","team","drs","innings","cs","sb","pb"])
        df=pd.DataFrame(rows)
        for col in ["drs","innings","cs","sb","pb"]:
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

def compute(merged):
    merged["raw_dscore"]=0.0; merged["adj_dscore"]=0.0; merged["dwar"]=0.0
    # Non-catcher positions (OAA + DRS + FRV)
    for pos,(w_oaa,w_drs,w_frv) in WEIGHTS.items():
        if pos=="C": continue  # handled separately below
        mask=merged["position"]==pos
        if mask.sum()==0: continue
        raw=(merged.loc[mask,"oaa_norm"]*w_oaa+merged.loc[mask,"drs_norm"]*w_drs+merged.loc[mask,"frv_norm"]*w_frv)
        adj=(raw+POSITIONAL_ADJ.get(pos,0)).clip(0,99)
        merged.loc[mask,"raw_dscore"]=raw.round(1)
        merged.loc[mask,"adj_dscore"]=adj.round(1)
        for idx in merged[mask].index:
            inn=float(merged.loc[idx,"innings"]) if "innings" in merged.columns else 0
            runs=(float(adj.loc[idx])-50)*0.4
            if inn>0: runs=runs*min(1.0,inn/1350)
            merged.loc[idx,"dwar"]=round(runs/9.5,2)
    # Catcher-specific formula
    c_mask=merged["position"]=="C"
    if c_mask.sum()>0:
        has_framing=merged.loc[c_mask,"frv"].abs().sum()>0
        has_arm=merged.loc[c_mask,"arm_val"].sum()>0
        if has_framing and has_arm:
            raw=(merged.loc[c_mask,"frv_norm"]*CATCHER_WEIGHTS["frv"]
                +merged.loc[c_mask,"drs_norm"]*CATCHER_WEIGHTS["drs"]
                +merged.loc[c_mask,"arm_norm"]*CATCHER_WEIGHTS["arm"]
                +merged.loc[c_mask,"block_norm"]*CATCHER_WEIGHTS["block"])
        elif has_framing:
            raw=(merged.loc[c_mask,"frv_norm"]*0.55+merged.loc[c_mask,"drs_norm"]*0.45)
        elif has_arm:
            raw=(merged.loc[c_mask,"drs_norm"]*0.50
                +merged.loc[c_mask,"arm_norm"]*0.30
                +merged.loc[c_mask,"block_norm"]*0.20)
        else:
            raw=merged.loc[c_mask,"drs_norm"]*0.35+merged.loc[c_mask,"frv_norm"]*0.65
        adj=(raw+POSITIONAL_ADJ["C"]).clip(0,99)
        merged.loc[c_mask,"raw_dscore"]=raw.round(1)
        merged.loc[c_mask,"adj_dscore"]=adj.round(1)
        for idx in merged[c_mask].index:
            inn=float(merged.loc[idx,"innings"]) if "innings" in merged.columns else 0
            runs=(float(adj.loc[idx])-50)*0.4
            if inn>0: runs=runs*min(1.0,inn/1350)
            merged.loc[idx,"dwar"]=round(runs/9.5,2)
    return merged

def gen_desc_catcher(p,pct,total):
    name=p["player"].split(",")[0]
    frv=p.get("frv",0); cs_pct=p.get("cs_pct",0); pb=p.get("pb",0)
    dwar=p["dwar"]; adj=p["adj_dscore"]; rank=p["rank"]
    tier="elite" if pct>=90 else "above-average" if pct>=75 else "average" if pct>=50 else "below-average"
    if frv!=0:
        framing_d=(f"exceptional framing (+{frv:.1f} FRV)" if frv>=12
                  else f"elite framing (+{frv:.1f} FRV)" if frv>=6
                  else f"above-average framing (+{frv:.1f} FRV)" if frv>=2
                  else f"average framing ({frv:.1f} FRV)" if frv>=0
                  else f"below-average framing ({frv:.1f} FRV)")
        frame_str=f"The Cutoff credits him with {framing_d}"
    else:
        frame_str="Framing data is pending for the early 2026 season"
    arm_str=""
    if cs_pct>0:
        arm_str=(f"His {cs_pct:.0f}% caught-stealing rate is among the best in baseball." if cs_pct>=36
                else f"His {cs_pct:.0f}% caught-stealing rate is above league average." if cs_pct>=28
                else f"His {cs_pct:.0f}% caught-stealing rate is near league average.")
    war_str=(f"His {dwar}+ D-WAR ranks among the most valuable defensive catchers in baseball." if dwar>=2
            else f"His {dwar} D-WAR represents meaningful value above replacement." if dwar>=1
            else f"His {dwar} D-WAR sits near replacement level.")
    parts=[f"{name} ranks #{rank} among {total} qualified catchers in 2026, posting a {tier} D-Score of {adj} — placing him in the {pct}th percentile.",
           frame_str+"."]
    if arm_str: parts.append(arm_str)
    parts.append(war_str)
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
    framing_df=pull_catcher_framing(year)

    pm={"CF":"CF","LF":"LF","RF":"RF","SS":"SS","2B":"2B","3B":"3B","1B":"1B","C":"C","C-1B":"C","MI":"SS","OF":"CF"}
    if not oaa_df.empty: oaa_df["position"]=oaa_df["position"].map(pm).fillna(oaa_df["position"])
    if not drs_df.empty: drs_df["player_name"]=drs_df["player_name"].apply(to_last_first)
    if oaa_df.empty and drs_df.empty:
        print("ERROR: No data from either source."); return
    if oaa_df.empty:
        merged=drs_df.copy(); merged["oaa"]=0.0
    elif drs_df.empty:
        merged=oaa_df.copy()
        for col in ["drs","innings","cs","sb","pb"]: merged[col]=0.0
    else:
        drs_cols=["player_name","position","drs","innings","cs","sb","pb"]
        drs_cols=[c for c in drs_cols if c in drs_df.columns]
        merged=pd.merge(oaa_df,drs_df[drs_cols],on=["player_name","position"],how="left")
        for col in ["drs","innings","cs","sb","pb"]:
            if col not in merged.columns: merged[col]=0.0
            else: merged[col]=merged[col].fillna(0)

    # Merge catcher framing (FRV)
    merged["frv"]=0.0
    if not framing_df.empty:
        framing_df=framing_df.rename(columns={"frv":"frv_new"})
        merged=pd.merge(merged,framing_df,on="player_name",how="left")
        merged["frv"]=merged.get("frv_new",pd.Series(0.0,index=merged.index)).fillna(0)
        if "frv_new" in merged.columns: merged=merged.drop(columns=["frv_new"])

    if "innings" not in merged.columns: merged["innings"]=0.0
    merged=merged[merged["position"].isin(WEIGHTS.keys())].copy()
    if merged.empty: print("ERROR: No players."); return

    # Standard normalizations
    merged["oaa_norm"]=normalize(merged,"oaa")
    merged["drs_norm"]=normalize(merged,"drs")
    merged["frv_norm"]=normalize(merged,"frv")

    # Catcher-specific normalizations
    merged["arm_val"]=0.0
    merged["block_val"]=0.0
    c_mask=merged["position"]=="C"
    if c_mask.any():
        total_sba=(merged.loc[c_mask,"cs"]+merged.loc[c_mask,"sb"]).clip(lower=1)
        merged.loc[c_mask,"arm_val"]=(merged.loc[c_mask,"cs"]/total_sba).round(4)
        pb_rate=merged.loc[c_mask,"pb"]/(merged.loc[c_mask,"innings"].clip(lower=1)/9)
        merged.loc[c_mask,"block_val"]=(-pb_rate).round(4)
    merged["arm_norm"]=normalize(merged,"arm_val")
    merged["block_norm"]=normalize(merged,"block_val")

    merged=compute(merged)

    rankings={}
    for pos in WEIGHTS:
        pos_df=merged[merged["position"]==pos].sort_values("adj_dscore",ascending=False).reset_index(drop=True)
        total=len(pos_df); entries=[]
        for i,r in pos_df.iterrows():
            rank=i+1; pct=round(((total-rank+1)/total)*100)
            mid=id_map.get(to_first_last(r["player_name"]),"") or id_map.get(r["player_name"],"")
            arm_val_pct=round(float(r.get("arm_val",0))*100,1)
            e={"rank":rank,"player":r["player_name"],"team":r.get("team",""),
               "position":pos,"mlb_id":mid,"headshot":hs_url(mid),
               "oaa":round(float(r["oaa"]),1),"drs":round(float(r["drs"]),1),
               "frv":round(float(r.get("frv",0)),1),
               "cs_pct":arm_val_pct,"cs":int(round(float(r.get("cs",0)))),
               "sb":int(round(float(r.get("sb",0)))),"pb":int(round(float(r.get("pb",0)))),
               "arm_norm":round(float(r.get("arm_norm",50)),1),
               "block_norm":round(float(r.get("block_norm",50)),1),
               "frv_norm":round(float(r.get("frv_norm",50)),1),
               "innings":round(float(r.get("innings",0))),
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
    out_paths=[os.path.join(script_dir,"dscore_rankings.json")]
    if os.path.isdir(site_dir): out_paths.append(os.path.join(site_dir,"dscore_rankings.json"))
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
