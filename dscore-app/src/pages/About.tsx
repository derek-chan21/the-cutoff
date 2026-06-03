import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from '../components/icons';

// "About" reads like the editorial mission statement of a publication.
// Tells the user WHAT D-Score measures (range, arm, blocking, framing,
// game-calling, etc.) and WHERE the data comes from — without ever
// disclosing the actual formulas or component weights.

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative max-w-[820px] mx-auto px-7 pt-12 pb-24"
    >
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-[10px] text-gold tracking-[0.18em] hover:-translate-x-1 transition-all mb-10 no-underline"
      >
        <ArrowLeft size={12} />
        BACK TO THE INDEX
      </Link>

      {/* Eyebrow */}
      <motion.div
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="font-mono text-[10px] tracking-[0.3em] text-rust mb-5"
      >
        EDITORIAL · METHODOLOGY
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.8 }}
        className="font-serif text-[clamp(44px,6vw,76px)] leading-[1.02] tracking-[-0.01em] text-cream mb-6"
      >
        What we're <span className="italic text-gold">trying to do.</span>
      </motion.h1>

      {/* Lede paragraph — editorial */}
      <motion.p
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="font-serif italic text-[20px] leading-[1.55] text-text/85 mb-12 max-w-[640px]"
      >
        Defense is the half of baseball that doesn't show up on a highlight reel.
        The Cutoff is an attempt to give it the seat at the table it deserves.
      </motion.p>

      {/* Decorative rule */}
      <hr className="border-t border-gold/25 my-10" />

      {/* ── Section 1: The Premise ─────────────────────────── */}
      <Section heading="The premise.">
        <p>
          For most of baseball's history, defense has been described in adjectives:
          a player has <em>good hands</em>, a <em>cannon for an arm</em>, an
          <em> easy first step</em>. Hitting and pitching have always had numbers —
          batting averages, ERAs, exit velocities — but defense has lived mostly in
          the eye of the beholder.
        </p>
        <p>
          That's changed. Statcast can measure how fast a fielder accelerates,
          how directly he routes a ball, and how often he converts a chance into
          an out. Baseball Reference tracks every error, every double play turned,
          every passed ball blocked. FanGraphs isolates how many runs a catcher
          steals with his glove, or how many runs a shortstop's arm prevents.
        </p>
        <p>
          The data exists. The problem is that it's <em>scattered</em>. You can read
          a player's Outs Above Average on one site, his Defensive Runs Saved on
          another, his Framing on a third — and have no good way to combine them
          into a single answer to the obvious question: <em>who is actually the
          best defender at his position right now?</em>
        </p>
      </Section>

      {/* ── Section 2: What D-Score Measures ─────────────────── */}
      <Section heading="What the D-Score measures.">
        <p>
          The D-Score is a single number — on the same 0-to-99 scale as
          baseball's other modern composites — that pulls together every public
          defensive metric and weighs them according to <em>what actually matters
          at that position</em>.
        </p>
        <p>
          A center fielder is graded mostly on the ground he covers. A catcher is
          judged on a completely different set of skills, almost none of which
          involve running. A second baseman lives or dies on his ability to turn
          a double play; a third baseman, on the long throw across the diamond.
          The score reflects that.
        </p>

        <p className="font-mono text-[11px] tracking-[0.18em] text-rust mt-8 mb-3">
          THE INPUTS, BY POSITION CATEGORY
        </p>

        <Bullet group="Outfielders (LF · CF · RF)">
          <em>Range</em> — how often a fielder converts catchable balls into outs,
          measured against the league-average outfielder facing the same chances.
          <em> Arm</em> — runs prevented by throws to bases or kept in front of cuts.
          <em> Overall fielding value</em> — composite runs saved beyond range.
        </Bullet>

        <Bullet group="Infielders (1B · 2B · 3B · SS)">
          <em>Range</em> — same idea, adjusted for the different chances an
          infielder faces. <em>Arm</em> — runs from the throw across the
          diamond, especially valuable for SS and 3B. <em>Double plays</em> —
          runs added by turning the pivot, especially for 2B and SS.
          <em> Overall fielding value</em> — error prevention, scoops, the rest.
        </Bullet>

        <Bullet group="Catchers (C)">
          <em>Framing</em> — runs added by stealing called strikes for the
          pitcher above what an average catcher would. <em>Throwing</em> —
          runs prevented by controlling the running game. <em>Blocking</em> —
          runs saved by keeping wild pitches in front instead of behind.
          <em> Game-calling</em> — the catcher's effect on the pitching staff's
          ERA above what would be expected. <em>Overall</em> — total defensive
          runs saved.
        </Bullet>

        <p className="mt-6">
          Each input is normalized within its own position pool, then combined
          into a position-specific weighting before a final positional adjustment
          is applied — premium up-the-middle defenders get a small bump,
          first basemen get a small deduction, on the principle that the
          best center fielder is more valuable than the best first baseman.
        </p>

        <p className="text-text/55 italic">
          The exact weights are kept private — that's the proprietary part. What
          they're applied to is everything written above.
        </p>
      </Section>

      {/* ── Section 3: Sources ───────────────────────────────── */}
      <Section heading="Where the data comes from.">
        <p>
          The D-Score is built from three public sources, refreshed daily:
        </p>
        <Source name="MLB Statcast" detail="Outs Above Average · sprint speed · pop time · arm strength · exchange time" />
        <Source name="Baseball Reference" detail="Defensive Runs Saved · innings · raw fielding counts" />
        <Source name="FanGraphs" detail="Component DRS (range, arm, double-play, good plays) · catcher framing · blocking · catcher ERA effect" />
        <p className="mt-6">
          Every morning at 6 a.m. Eastern, an automated process re-pulls the
          season-to-date data, recomputes every player's components, and
          re-publishes the rankings. If a player makes a great play tonight
          and it's reflected in tomorrow's Statcast pull, it will be in the
          D-Score by breakfast.
        </p>
      </Section>

      {/* ── Section 4: Limits ─────────────────────────────────── */}
      <Section heading="What the D-Score is not.">
        <p>
          It is not a predictive model. The D-Score grades what a player has done
          this season — not what he is <em>likely to do</em> next year.
        </p>
        <p>
          It is not a substitute for watching the game. A 90 D-Score does not
          mean a defender is identical to another 90 D-Score; the underlying
          components can tell two very different stories. The component breakdown
          on every player profile exists for exactly that reason.
        </p>
        <p>
          And it is not infallible. Defensive metrics, even the best of them,
          carry meaningful error bars — small-sample players are scaled
          accordingly, traded players are recombined as best as possible, and
          early-season scores should be read with the same skepticism you'd
          read a .400 batting average on May 1st.
        </p>
      </Section>

      {/* ── CTA back to index ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="mt-16 pt-10 border-t border-gold/25 flex items-center justify-between flex-wrap gap-4"
      >
        <p className="font-serif italic text-[16px] text-text/75 max-w-[420px]">
          Read the rankings the same way you'd read a magazine — chapter by chapter,
          position by position.
        </p>
        <Link
          to="/"
          className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-mono text-[11px] tracking-[0.18em] bg-gold text-bg hover:bg-cream transition-colors no-underline"
        >
          BEGIN READING
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ── Editorial section wrapper ─────────────────────────────────
function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ y: 14, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.6 }}
      className="mb-12"
    >
      <h2 className="font-serif text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.005em] text-cream mb-5">
        {heading}
      </h2>
      <div className="font-body text-[16.5px] leading-[1.75] text-text/85 space-y-5 font-light max-w-[680px]">
        {children}
      </div>
    </motion.section>
  );
}

// ── Bullet for the "inputs by position" list ───────────────────
function Bullet({ group, children }: { group: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-l-2 border-gold/25 pl-5">
      <div className="font-mono text-[10px] tracking-[0.18em] text-gold mb-2 uppercase">
        {group}
      </div>
      <p className="font-body text-[15px] leading-[1.7] text-text/80 font-light">
        {children}
      </p>
    </div>
  );
}

// ── Single source line item ───────────────────────────────────
function Source({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="mt-4 grid grid-cols-[1fr_2fr] gap-5 items-baseline border-b border-gold/12 pb-3">
      <div className="font-serif text-[18px] text-cream">{name}</div>
      <div className="font-mono text-[11px] tracking-[0.08em] text-text/65 leading-relaxed">
        {detail}
      </div>
    </div>
  );
}
