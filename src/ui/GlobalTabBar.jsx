import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Swords, LogIn, User } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'

const TABS = [
  { path: '/', label: '广场', icon: Home },
  { path: '/create-match', label: '发起对局', icon: Swords },
  { path: '/join', label: '加入对局', icon: LogIn },
  { path: '/profile', label: '我的', icon: User },
]

// Paths that are "in-match" — TabBar shows but navigation needs active-match guard
const GUARDED_PATHS = ['/create-match', '/join']

function ActiveMatchModal({ activeMatchId, onContinue, onAbandon, loading }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          backgroundColor: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: 0,
        }}
        className="p-6 max-w-sm w-full"
      >
        <div className="text-center mb-6">
          <span className="text-4xl mb-3 block">🎱</span>
          <h3 className="text-base font-bold mb-2 uppercase tracking-industrial text-ink-primary">你正在一场球局中</h3>
          <p className="text-ink-secondary text-sm leading-relaxed">
            你目前有一场进行中的对局，请先完成当前比赛。
          </p>
          <p className="text-signal-amber text-xs mt-2 font-semibold uppercase tracking-label" style={{ color: '#7a6020' }}>
            ⚡ 中途退赛会影响你的信誉度评分（Karma）
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onContinue}
            className="w-full font-bold py-3 text-sm uppercase tracking-industrial transition-colors text-ink-primary"
            style={{ backgroundColor: '#c45c1a' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e07a3a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#c45c1a'}
          >
            返回当前比赛
          </button>
          <button
            onClick={onAbandon}
            disabled={loading}
            className="w-full font-bold py-3 text-sm uppercase tracking-industrial transition-colors disabled:opacity-40"
            style={{ border: '1px solid #8b3a3a', color: '#8b3a3a', background: 'transparent' }}
          >
            {loading ? '退出中...' : '放弃当前对局'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function GlobalTabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeMatch, setActiveMatch] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingPath, setPendingPath] = useState(null)
  const [abandonLoading, setAbandonLoading] = useState(false)

  // Check for active match on mount and route change
  useEffect(() => {
    async function checkActiveMatch() {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      const { data } = await supabase
        .from('matches')
        .select('id, status')
        .or(`player_a_id.eq.${userId},player_b_id.eq.${userId}`)
        .in('status', ['locked', 'awaiting_confirmation', 'processing'])
        .maybeSingle()

      setActiveMatch(data || null)
    }
    checkActiveMatch()
  }, [location.pathname])

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  function handleTabClick(path) {
    // If navigating to guarded paths while in active match, intercept
    if (GUARDED_PATHS.includes(path) && activeMatch) {
      setPendingPath(path)
      setShowModal(true)
      return
    }
    navigate(path)
  }

  function handleContinue() {
    setShowModal(false)
    setPendingPath(null)
    if (activeMatch?.id) {
      navigate(`/submit/${activeMatch.id}`)
    }
  }

  async function handleAbandon() {
    setAbandonLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/abandon-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ match_id: activeMatch.id }),
      })
      setActiveMatch(null)
      setShowModal(false)
      if (pendingPath) navigate(pendingPath)
    } catch (e) {
      setShowModal(false)
      if (pendingPath) navigate(pendingPath)
    } finally {
      setAbandonLoading(false)
      setPendingPath(null)
    }
  }

  return (
    <>
      {/* Industrial bottom nav */}
      <div
        className="sticky bottom-0 z-50"
        style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #1e1e1e' }}
      >
        {/* Active match banner */}
        {activeMatch && (
          <button
            onClick={() => navigate(`/submit/${activeMatch.id}`)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold uppercase tracking-label transition-colors"
            style={{
              backgroundColor: '#7a3a0f',
              borderBottom: '1px solid #c45c1a',
              color: '#e07a3a',
            }}
          >
            <span className="w-2 h-2 animate-pulse" style={{ backgroundColor: '#c45c1a', display: 'inline-block' }} />
            当前有进行中的对局 — 点击返回
          </button>
        )}
        <div className="flex">
          {TABS.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <button
                key={path}
                onClick={() => handleTabClick(path)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors min-h-[56px] active:opacity-70"
                style={{ background: 'transparent' }}
              >
                <Icon
                  aria-hidden="true"
                  size={20}
                  style={{ color: active ? '#c45c1a' : '#5c5c58' }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-label"
                  style={{ color: active ? '#c45c1a' : '#5c5c58' }}
                >
                  {label}
                </span>
                {active && (
                  <span
                    className="w-6 mt-0.5"
                    style={{ height: '2px', backgroundColor: '#c45c1a', display: 'block' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {showModal && (
        <ActiveMatchModal
          activeMatchId={activeMatch?.id}
          onContinue={handleContinue}
          onAbandon={handleAbandon}
          loading={abandonLoading}
        />
      )}
    </>
  )
}
