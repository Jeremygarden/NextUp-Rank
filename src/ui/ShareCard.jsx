import React from 'react'
import { getRankInfo } from '../lib/rankColor'

/**
 * ShareCard — hidden off-screen component for html-to-image screenshot.
 * Size: 390x690px (mobile-friendly)
 */
export default function ShareCard({ myNickname, opponentNickname, ratingBefore, ratingAfter, racksWon, racksLost, isWin, cardRef }) {
  const delta = Math.round(ratingAfter - ratingBefore)
  const rank = getRankInfo(Math.round(ratingAfter))
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '390px',
        height: '690px',
        background: '#020617', // slate-950
        fontFamily: "'Inter', 'PingFang SC', 'Helvetica Neue', sans-serif",
        color: '#f1f5f9',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background glow decoration */}
      <div style={{
        position: 'absolute',
        top: '-80px',
        left: '-80px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        right: '-60px',
        width: '240px',
        height: '240px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top header */}
      <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>对局战报</span>
        <span style={{ fontSize: '11px', color: '#475569' }}>{today}</span>
      </div>

      {/* Main result area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
        {/* Win/loss icon + headline */}
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>{isWin ? '🏆' : '😤'}</div>
        <div style={{
          fontSize: '32px',
          fontWeight: 900,
          marginBottom: '28px',
          color: isWin ? '#4ade80' : '#f87171',
          letterSpacing: '-0.02em',
        }}>
          {isWin ? '胜利！' : '虽败犹荣'}
        </div>

        {/* Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '64px', fontWeight: 900, fontFamily: "'SF Mono', 'Fira Code', monospace", color: isWin ? '#4ade80' : '#f87171', lineHeight: 1 }}>{racksWon}</span>
          <span style={{ fontSize: '28px', color: '#475569', fontWeight: 700 }}>:</span>
          <span style={{ fontSize: '64px', fontWeight: 900, fontFamily: "'SF Mono', 'Fira Code', monospace", color: isWin ? '#f87171' : '#4ade80', lineHeight: 1 }}>{racksLost}</span>
        </div>

        {/* Nicknames */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>{myNickname}</span>
          <span style={{ fontSize: '12px', color: '#475569' }}>vs</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8' }}>{opponentNickname}</span>
        </div>

        {/* Rating change card */}
        <div style={{
          width: '100%',
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          {/* Rating flow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#94a3b8' }}>{Math.round(ratingBefore)}</span>
            <span style={{ fontSize: '14px', color: '#475569' }}>→</span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: delta >= 0 ? '#4ade80' : '#f87171' }}>
              {delta >= 0 ? '+' : ''}{delta}
            </span>
            <span style={{ fontSize: '14px', color: '#475569' }}>→</span>
            <span style={{ fontSize: '26px', fontWeight: 900, color: '#818cf8' }}>{Math.round(ratingAfter)}</span>
          </div>

          {/* Rank badge */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: rank.color + '22',
              border: `1px solid ${rank.color}55`,
              borderRadius: '999px',
              padding: '5px 16px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: rank.color }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: rank.color }}>{rank.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom brand bar */}
      <div style={{
        padding: '16px 28px 24px',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#818cf8', letterSpacing: '-0.01em' }}>NextUp-Rank</div>
          <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>台球积分系统</div>
        </div>
        <div style={{ fontSize: '11px', color: '#334155', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          nextup-rank.vercel.app
        </div>
      </div>
    </div>
  )
}
