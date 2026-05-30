// Official MLB team brand colors + real ballpark photos (via Wikipedia REST API).
// Each team gets its own actual stadium image as the player profile backdrop.

export interface TeamBrand {
  name: string;
  ballpark: string;
  city: string;
  primary: string;
  secondary: string;
  logoId: number;        // MLB CDN id for team logo
  stadiumImage: string;  // direct image URL
}

// Pexels-hosted ballpark photos (verified hot-link friendly, 200 OK).
// 20 teams have their actual stadium; the remaining 10 fall back to
// rotating generic baseball photos. Pexels searches don't index every
// team's stadium (less-iconic ones like Tropicana, Sutter Health,
// Angel Stadium, Citi Field, etc. weren't available there).
const px = (id: string | number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1800`;

const PEXELS_SPECIFIC: Record<string, string> = {
  BOS: px(8304432),   // Fenway Park
  CHC: px(25547645),  // Wrigley Field
  NYY: px(28670355),  // Yankee Stadium
  LAD: px(16975558),  // Dodger Stadium
  SF:  px(15322763),  // Oracle Park
  BAL: px(569848),    // Camden Yards
  COL: px(6982867),   // Coors Field
  PIT: px(8492244),   // PNC Park / Pittsburgh
  STL: px(8043400),   // Busch Stadium
  SD:  px(14547696),  // Petco Park
  MIN: px(28772775),  // Target Field
  DET: px(17530598),  // Comerica Park
  ARI: px(31167777),  // Chase Field
  SEA: px(26840761),  // T-Mobile Park
  TEX: px(264279),    // Globe Life Field
  HOU: px(26605711),  // Daikin Park / Minute Maid
  TOR: px(7661376),   // Rogers Centre
  KC:  px(6252480),   // Kauffman Stadium
  CIN: px(9675741),   // Great American Ball Park
  CLE: px(34087592),  // Progressive Field
};

const PEXELS_GENERIC = [
  'https://images.pexels.com/photos/16547083/pexels-photo-16547083.jpeg?auto=compress&w=1800',
  'https://images.pexels.com/photos/17723968/pexels-photo-17723968.jpeg?auto=compress&w=1800',
  'https://images.pexels.com/photos/36780546/pexels-photo-36780546.jpeg?auto=compress&w=1800',
  'https://images.pexels.com/photos/25547640/pexels-photo-25547640.jpeg?auto=compress&w=1800',
  'https://images.pexels.com/photos/139762/pexels-photo-139762.jpeg?auto=compress&w=1800',
];
const pickStadium = (i: number) => PEXELS_GENERIC[Math.abs(i) % PEXELS_GENERIC.length];

// Each team gets a stadium photo — team-specific where Pexels has one,
// otherwise rotated through generic baseball stadium photos.
const PHOTOS: Record<string, string> = {};
const TEAM_INDEX_FOR_PHOTO: Record<string, number> = {
  BAL: 0, TBR: 1, TOR: 2, CWS: 3, CLE: 4, DET: 0, KC: 1, MIN: 2,
  HOU: 3, LAA: 4, ATH: 0, SEA: 1, TEX: 2, ATL: 3, MIA: 4,
  NYM: 0, PHI: 1, WSH: 2, CIN: 3, MIL: 4, PIT: 0, STL: 1,
  ARI: 2, COL: 3, SD: 4, SF: 0,
};
Object.entries(TEAM_INDEX_FOR_PHOTO).forEach(([abbr, idx]) => {
  PHOTOS[abbr] = pickStadium(idx);
});
// Overwrite with team-specific photos where we have them
Object.entries(PEXELS_SPECIFIC).forEach(([abbr, url]) => {
  PHOTOS[abbr] = url;
});

const generic = pickStadium(0);

export const TEAMS: Record<string, TeamBrand> = {
  // AL East
  BAL: { name: 'Baltimore Orioles',    ballpark: 'Oriole Park at Camden Yards', city: 'Baltimore',       primary: '#DF4601', secondary: '#000000', logoId: 110, stadiumImage: PHOTOS.BAL },
  BOS: { name: 'Boston Red Sox',       ballpark: 'Fenway Park',                  city: 'Boston',         primary: '#BD3039', secondary: '#0C2340', logoId: 111, stadiumImage: PHOTOS.BOS },
  NYY: { name: 'New York Yankees',     ballpark: 'Yankee Stadium',               city: 'New York',       primary: '#003087', secondary: '#E4002C', logoId: 147, stadiumImage: PHOTOS.NYY },
  TBR: { name: 'Tampa Bay Rays',       ballpark: 'Tropicana Field',              city: 'St. Petersburg', primary: '#092C5C', secondary: '#8FBCE6', logoId: 139, stadiumImage: PHOTOS.TBR },
  TB:  { name: 'Tampa Bay Rays',       ballpark: 'Tropicana Field',              city: 'St. Petersburg', primary: '#092C5C', secondary: '#8FBCE6', logoId: 139, stadiumImage: PHOTOS.TBR },
  TOR: { name: 'Toronto Blue Jays',    ballpark: 'Rogers Centre',                city: 'Toronto',        primary: '#134A8E', secondary: '#1D2D5C', logoId: 141, stadiumImage: PHOTOS.TOR },

  // AL Central
  CWS: { name: 'Chicago White Sox',    ballpark: 'Rate Field',                   city: 'Chicago',        primary: '#27251F', secondary: '#C4CED4', logoId: 145, stadiumImage: PHOTOS.CWS },
  CHW: { name: 'Chicago White Sox',    ballpark: 'Rate Field',                   city: 'Chicago',        primary: '#27251F', secondary: '#C4CED4', logoId: 145, stadiumImage: PHOTOS.CWS },
  CLE: { name: 'Cleveland Guardians',  ballpark: 'Progressive Field',            city: 'Cleveland',      primary: '#00385D', secondary: '#E50022', logoId: 114, stadiumImage: PHOTOS.CLE },
  DET: { name: 'Detroit Tigers',       ballpark: 'Comerica Park',                city: 'Detroit',        primary: '#0C2340', secondary: '#FA4616', logoId: 116, stadiumImage: PHOTOS.DET },
  KC:  { name: 'Kansas City Royals',   ballpark: 'Kauffman Stadium',             city: 'Kansas City',    primary: '#004687', secondary: '#BD9B60', logoId: 118, stadiumImage: PHOTOS.KC },
  KCR: { name: 'Kansas City Royals',   ballpark: 'Kauffman Stadium',             city: 'Kansas City',    primary: '#004687', secondary: '#BD9B60', logoId: 118, stadiumImage: PHOTOS.KC },
  MIN: { name: 'Minnesota Twins',      ballpark: 'Target Field',                 city: 'Minneapolis',    primary: '#002B5C', secondary: '#D31145', logoId: 142, stadiumImage: PHOTOS.MIN },

  // AL West
  HOU: { name: 'Houston Astros',       ballpark: 'Daikin Park',                  city: 'Houston',        primary: '#EB6E1F', secondary: '#002D62', logoId: 117, stadiumImage: PHOTOS.HOU },
  LAA: { name: 'Los Angeles Angels',   ballpark: 'Angel Stadium',                city: 'Anaheim',        primary: '#BA0021', secondary: '#003263', logoId: 108, stadiumImage: PHOTOS.LAA },
  ATH: { name: 'Athletics',            ballpark: 'Sutter Health Park',           city: 'West Sacramento',primary: '#003831', secondary: '#EFB21E', logoId: 133, stadiumImage: PHOTOS.ATH },
  OAK: { name: 'Athletics',            ballpark: 'Sutter Health Park',           city: 'West Sacramento',primary: '#003831', secondary: '#EFB21E', logoId: 133, stadiumImage: PHOTOS.ATH },
  SEA: { name: 'Seattle Mariners',     ballpark: 'T-Mobile Park',                city: 'Seattle',        primary: '#0C2C56', secondary: '#005C5C', logoId: 136, stadiumImage: PHOTOS.SEA },
  TEX: { name: 'Texas Rangers',        ballpark: 'Globe Life Field',             city: 'Arlington',      primary: '#003278', secondary: '#C0111F', logoId: 140, stadiumImage: PHOTOS.TEX },

  // NL East
  ATL: { name: 'Atlanta Braves',       ballpark: 'Truist Park',                  city: 'Atlanta',        primary: '#CE1141', secondary: '#13274F', logoId: 144, stadiumImage: PHOTOS.ATL },
  MIA: { name: 'Miami Marlins',        ballpark: 'loanDepot park',               city: 'Miami',          primary: '#00A3E0', secondary: '#EF3340', logoId: 146, stadiumImage: PHOTOS.MIA },
  NYM: { name: 'New York Mets',        ballpark: 'Citi Field',                   city: 'New York',       primary: '#FF5910', secondary: '#002D72', logoId: 121, stadiumImage: PHOTOS.NYM },
  PHI: { name: 'Philadelphia Phillies',ballpark: 'Citizens Bank Park',           city: 'Philadelphia',   primary: '#E81828', secondary: '#002D72', logoId: 143, stadiumImage: PHOTOS.PHI },
  WSH: { name: 'Washington Nationals', ballpark: 'Nationals Park',               city: 'Washington',     primary: '#AB0003', secondary: '#14225A', logoId: 120, stadiumImage: PHOTOS.WSH },
  WSN: { name: 'Washington Nationals', ballpark: 'Nationals Park',               city: 'Washington',     primary: '#AB0003', secondary: '#14225A', logoId: 120, stadiumImage: PHOTOS.WSH },

  // NL Central
  CHC: { name: 'Chicago Cubs',         ballpark: 'Wrigley Field',                city: 'Chicago',        primary: '#0E3386', secondary: '#CC3433', logoId: 112, stadiumImage: PHOTOS.CHC },
  CIN: { name: 'Cincinnati Reds',      ballpark: 'Great American Ball Park',     city: 'Cincinnati',     primary: '#C6011F', secondary: '#000000', logoId: 113, stadiumImage: PHOTOS.CIN },
  MIL: { name: 'Milwaukee Brewers',    ballpark: 'American Family Field',        city: 'Milwaukee',      primary: '#12284B', secondary: '#FFC52F', logoId: 158, stadiumImage: PHOTOS.MIL },
  PIT: { name: 'Pittsburgh Pirates',   ballpark: 'PNC Park',                     city: 'Pittsburgh',     primary: '#FDB827', secondary: '#27251F', logoId: 134, stadiumImage: PHOTOS.PIT },
  STL: { name: 'St. Louis Cardinals',  ballpark: 'Busch Stadium',                city: 'St. Louis',      primary: '#C41E3A', secondary: '#0C2340', logoId: 138, stadiumImage: PHOTOS.STL },

  // NL West
  ARI: { name: 'Arizona Diamondbacks', ballpark: 'Chase Field',                  city: 'Phoenix',        primary: '#A71930', secondary: '#E3D4AD', logoId: 109, stadiumImage: PHOTOS.ARI },
  COL: { name: 'Colorado Rockies',     ballpark: 'Coors Field',                  city: 'Denver',         primary: '#33006F', secondary: '#C4CED4', logoId: 115, stadiumImage: PHOTOS.COL },
  LAD: { name: 'Los Angeles Dodgers',  ballpark: 'Dodger Stadium',               city: 'Los Angeles',    primary: '#005A9C', secondary: '#EF3E42', logoId: 119, stadiumImage: PHOTOS.LAD },
  SD:  { name: 'San Diego Padres',     ballpark: 'Petco Park',                   city: 'San Diego',      primary: '#2F241D', secondary: '#FFC425', logoId: 135, stadiumImage: PHOTOS.SD },
  SDP: { name: 'San Diego Padres',     ballpark: 'Petco Park',                   city: 'San Diego',      primary: '#2F241D', secondary: '#FFC425', logoId: 135, stadiumImage: PHOTOS.SD },
  SF:  { name: 'San Francisco Giants', ballpark: 'Oracle Park',                  city: 'San Francisco',  primary: '#FD5A1E', secondary: '#27251F', logoId: 137, stadiumImage: PHOTOS.SF },
  SFG: { name: 'San Francisco Giants', ballpark: 'Oracle Park',                  city: 'San Francisco',  primary: '#FD5A1E', secondary: '#27251F', logoId: 137, stadiumImage: PHOTOS.SF },
};

export const DEFAULT_TEAM: TeamBrand = {
  name: 'Major League Baseball',
  ballpark: 'MLB Stadium',
  city: '',
  primary: '#d4a55a',
  secondary: '#c54a3f',
  logoId: 0,
  stadiumImage: generic,
};

// Team-name aliases — our pipeline pulls team identifiers from 3 different
// sources (Statcast/BRef/FanGraphs) and they use inconsistent formats.
// This maps every variation to a canonical abbreviation in TEAMS.
const TEAM_ALIASES: Record<string, string> = {
  // Common full-team-name forms (from FanGraphs)
  'YANKEES':'NYY', 'RED SOX':'BOS', 'ORIOLES':'BAL', 'RAYS':'TBR', 'BLUE JAYS':'TOR',
  'WHITE SOX':'CWS', 'GUARDIANS':'CLE', 'TIGERS':'DET', 'ROYALS':'KC', 'TWINS':'MIN',
  'ASTROS':'HOU', 'ANGELS':'LAA', 'ATHLETICS':'ATH', "A'S":'ATH', 'MARINERS':'SEA', 'RANGERS':'TEX',
  'BRAVES':'ATL', 'MARLINS':'MIA', 'METS':'NYM', 'PHILLIES':'PHI', 'NATIONALS':'WSH',
  'CUBS':'CHC', 'REDS':'CIN', 'BREWERS':'MIL', 'PIRATES':'PIT', 'CARDINALS':'STL',
  'DIAMONDBACKS':'ARI', 'D-BACKS':'ARI', 'ROCKIES':'COL', 'DODGERS':'LAD',
  'PADRES':'SD', 'GIANTS':'SF',
  // Alternate abbreviations
  'CHW':'CWS', 'KCR':'KC', 'SDP':'SD', 'SFG':'SF', 'WSN':'WSH', 'TB':'TBR', 'OAK':'ATH',
};

export function getTeam(abbr: string): TeamBrand {
  if (!abbr) return DEFAULT_TEAM;
  const raw = abbr.toUpperCase().trim();
  if (!raw || raw === '---' || raw === '- - -' || /^\d+\s*TMS?$/.test(raw)) return DEFAULT_TEAM;
  // Try direct abbreviation, then alias map, then full name match
  const canon = TEAMS[raw] ? raw : (TEAM_ALIASES[raw] || raw);
  return TEAMS[canon] || DEFAULT_TEAM;
}

export function teamLogo(abbr: string, size: 'cap' | 'primary' = 'primary') {
  const t = getTeam(abbr);
  if (!t.logoId) return null;
  return `https://www.mlbstatic.com/team-logos/${size === 'cap' ? 'team-cap-on-light/' : ''}${t.logoId}.svg`;
}

export function teamGradient(abbr: string): string {
  const t = getTeam(abbr);
  return `radial-gradient(at 20% 30%, ${t.primary}55 0%, transparent 50%),
          radial-gradient(at 80% 20%, ${t.secondary}40 0%, transparent 50%),
          radial-gradient(at 50% 90%, ${t.primary}30 0%, transparent 60%),
          linear-gradient(135deg, #1a2030, #0d1419)`;
}
