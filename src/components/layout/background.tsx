'use client';

export function AmbientBackground({ state }: { state: 'idle' | 'processing' | 'completed' }) {
  return (
    <div className={`ambient-bg ${state}`} aria-hidden="true">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
      {/* Grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 1px 1px, var(--border) 0.5px, transparent 0.5px)`,
        backgroundSize: '48px 48px',
        opacity: 0.3,
      }} />
    </div>
  );
}
