import { motion, AnimatePresence } from 'framer-motion';

const AGENT_META = {
  'Battery Intelligence':           { icon: '🔋', accent: '#22c55e' },
  'Route Intelligence':             { icon: '🗺️', accent: '#00f0ff' },
  'Charging Intelligence':          { icon: '⚡', accent: '#d4d414' },
  'Emergency Assistance':           { icon: '🚨', accent: '#ff5050' },
  'Energy & Sustainability':        { icon: '🌱', accent: '#22c55e' },
  'Pricing & Cost':                 { icon: '💰', accent: '#f59e0b' },
  'Analytics & Reports':            { icon: '📊', accent: '#60a5fa' },
  'Weather & Climate Intelligence': { icon: '🌤️', accent: '#38bdf8' },
  'Driver Behavior & Safety':       { icon: '🏎️', accent: '#a855f7' },
  'Grid Load & V2G Optimization':   { icon: '🔌', accent: '#ec4899' },
  'Predictive Fleet Maintenance':   { icon: '🔧', accent: '#f97316' },
  'Supervisor Synthesis':           { icon: '🧠', accent: '#ffffff' },
};

/**
 * Agent Collaboration Console — Spacious & neat execution log
 */
export default function AgentConsole({ agentLog = [], activeAgents = [], isRunning = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>Live Orchestration Log</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            Agent Execution Sequence
          </h3>
        </div>
        {isRunning && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(212, 212, 20, 0.1)', border: '1px solid rgba(212, 212, 20, 0.4)',
              color: 'var(--accent)', fontSize: 12, fontWeight: 700,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
            Agents Running…
          </motion.div>
        )}
      </div>

      {/* Active agents strip */}
      {activeAgents.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {activeAgents.map(name => {
            const meta = AGENT_META[name] || { icon: '🤖', accent: 'var(--text-muted)' };
            return (
              <motion.div
                key={name}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rydex-badge"
                style={{
                  borderColor: `${meta.accent}66`, color: meta.accent,
                  background: `${meta.accent}15`, fontSize: 11, padding: '5px 12px',
                }}
              >
                <motion.span animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 2 }}>
                  {meta.icon}
                </motion.span>
                {name}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Log entries */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 520, paddingRight: 6 }}>
        <AnimatePresence>
          {agentLog.length === 0 && !isRunning && (
            <div style={{
              color: 'var(--text-muted)', fontSize: 13, textAlign: 'center',
              padding: '60px 20px', lineHeight: 1.6, background: 'rgba(255,255,255,0.01)',
              borderRadius: 12, border: '1px dashed var(--border-muted)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
              Click <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Proceed</span> in the Route Planning card to trigger multi-agent intelligence
            </div>
          )}
          {[...agentLog].reverse().map((entry, i) => {
            const meta = AGENT_META[entry.agent] || { icon: '🤖', accent: 'var(--text-muted)' };
            const confidence = entry.result?.confidence_score;
            return (
              <motion.div
                key={`${entry.agent}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  padding: '16px 18px', marginBottom: 14,
                  background: 'rgba(17, 17, 16, 0.6)',
                  border: '1px solid var(--border-muted)', borderRadius: 10,
                }}
              >
                {/* Row header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }} />
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: meta.accent }}>
                      {meta.icon} {entry.agent}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {confidence !== undefined && (
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20,
                        background: `${meta.accent}18`, border: `1px solid ${meta.accent}44`,
                        color: meta.accent, fontWeight: 700,
                      }}>
                        {(confidence * 100).toFixed(0)}% Confidence
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{entry.durationMs}ms</span>
                  </div>
                </div>

                {/* Confidence bar */}
                {confidence !== undefined && (
                  <div className="rydex-progress" style={{ marginBottom: 10, height: 4 }}>
                    <div style={{ height: '100%', width: `${confidence * 100}%`, background: meta.accent, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                )}

                {/* Untruncated full reasoning */}
                {entry.result?.reasoning && (
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {entry.result.reasoning}
                  </div>
                )}
                {entry.result?.error && (
                  <div style={{ fontSize: 12, color: 'var(--alert-red)', marginTop: 6, fontWeight: 600 }}>Error: {entry.result.error}</div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
