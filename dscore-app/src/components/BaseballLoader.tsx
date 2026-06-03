export default function BaseballLoader({ label = 'LOADING DATA' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-32">
      <span className="bb-ball bounce w-12 h-12" />
      <span className="font-mono text-[13px] text-gold tracking-[0.22em] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-dot" />
        {label}
      </span>
    </div>
  );
}
