import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Rating → tier color mapping
function getRatingColor(rating) {
  if (rating >= 2000) return '#FFDD94' // gold
  if (rating >= 1600) return '#B6E3CE' // jade
  if (rating >= 1200) return '#93C5FD' // blue
  return '#94A3B8' // slate
}

function Avatar({ nickname, rating, size = 64 }) {
  const letter = (nickname || '?')[0].toUpperCase()
  const bg = getRatingColor(rating)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 'bold',
        color: '#0F172A',
        boxShadow: `0 0 20px ${bg}66`,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  )
}

// 8-ray radial burst
function RadialBurst({ visible }) {
  const rays = Array.from({ length: 8 }, (_, i) => i)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {rays.map(i => {
        const angle = (i / 8) * 360
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={visible ? { opacity: [0, 1, 0], scale: [0.3, 1.6, 2.2] } : {}}
            transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 4,
              height: 36,
              background: 'linear-gradient(to top, #B6E3CE, #FFDD94)',
              borderRadius: 2,
              transformOrigin: 'center 70px',
              transform: `rotate(${angle}deg) translateY(-70px)`,
            }}
          />
        )
      })}
    </div>
  )
}

export default function LBSHandshakeAnimation({ playerA, playerB, onComplete }) {
  const [phase, setPhase] = useState(1) // 1,2,3

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 800)
    const t2 = setTimeout(() => setPhase(3), 1800)
    const t3 = setTimeout(() => onComplete?.(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pA = playerA || { nickname: '对手', rating: 1500 }
  const pB = playerB || { nickname: '我', rating: 1500 }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617', // slate-950
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow flash on phase 3 */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, #4F46E5 0%, #10B981 50%, transparent 80%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Phase 1: Scanning pulse rings */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div
            key="scan"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 160, height: 160 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '2px solid #B6E3CE',
                }}
              />
            ))}
            <span style={{ fontSize: 40, position: 'relative', zIndex: 1 }}>📍</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2 & 3: Avatars */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            key="avatars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}
          >
            {/* Player A - slides from left */}
            <motion.div
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: phase >= 3 ? -10 : 0, opacity: 1 }}
              transition={phase >= 3
                ? { type: 'spring', stiffness: 300, damping: 15 }
                : { type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }
              }
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              <Avatar nickname={pA.nickname} rating={pA.rating} size={72} />
              <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 'bold' }}>{pA.nickname}</span>
            </motion.div>

            {/* Center icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
              style={{ fontSize: 32, flexShrink: 0, position: 'relative', zIndex: 2 }}
            >
              {phase >= 3 ? '🔒' : '⚡'}
            </motion.div>

            {/* Player B - slides from right */}
            <motion.div
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: phase >= 3 ? 10 : 0, opacity: 1 }}
              transition={phase >= 3
                ? { type: 'spring', stiffness: 300, damping: 15 }
                : { type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }
              }
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              <Avatar nickname={pB.nickname} rating={pB.rating} size={72} />
              <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 'bold' }}>{pB.nickname}</span>
            </motion.div>

            {/* Radial burst (phase 3) */}
            {phase >= 3 && <RadialBurst visible={true} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock scale-up on phase 3 */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            key="lock-big"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.2 }}
            style={{ fontSize: 72, marginTop: 24, position: 'relative', zIndex: 3 }}
          >
            🔒
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status text */}
      <motion.p
        key={phase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          marginTop: 32,
          color: phase >= 3 ? '#FFDD94' : '#B6E3CE',
          fontWeight: 'bold',
          fontSize: phase >= 3 ? 20 : 16,
          letterSpacing: '0.05em',
          textAlign: 'center',
        }}
      >
        {phase === 1 && '正在验证位置...'}
        {phase === 2 && '位置已确认 ✓'}
        {phase >= 3 && '对局已锁定！'}
      </motion.p>

      {/* Gradient ring decoration */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(#020617, #020617), linear-gradient(135deg, #B6E3CE, #FFDD94)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
