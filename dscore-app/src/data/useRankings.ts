import { useEffect, useState } from 'react';
import type { RankingsData } from '../types';

// React hook: loads the rankings JSON once and caches it
export function useRankings() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}dscore_rankings.json`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: RankingsData) => { if (!cancelled) setData(json); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return { data, error };
}
