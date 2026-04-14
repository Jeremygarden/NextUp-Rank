import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Swords, LogIn, User, AlertTriangle } from 'lucide-react'
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full"
      >
        <div className="text-center mb-6">
          <span className="text-4xl mb-3 block">🎱</span>
          <h3 className="text-lg font-bold mb-2">你正在一场球局中</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            你目前有一场进行中的对局，请先完成当前比赛。
          </p>
          <p className="text-amber-400 text-xs mt-2 font-medium">
            ⚡ 中途退赛会影响你的信誉度评分（Karma）
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl transition-colors"
          >
            返回当前比赛
          </button>
          <button
            onClick={onAbandon}
            disabled={loading}
            className="w-full border border-red-800/60 text-red-400 hover:bg-red-500/10 disabled:opacity-40 font-bold py-3 rounded-2xl transition-colors"
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
    // Navigate to the active match's submit page
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
      <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-50">
        {/* Active match banner */}
        {activeMatch && (
          <button
            onClick={() => navigate(`/submit/${activeMatch.id}`)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600/20 border-b border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-600/30 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
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
              >
                <Icon
                  aria-hidden="true"
                  size={22}
                  className={active ? 'text-indigo-400' : 'text-slate-500'}
                />
                <span
                  className={`text-xs font-medium ${active ? 'text-indigo-400' : 'text-slate-500'}`}
                >
                  {label}
                </span>
                {active && (
                  <span className="w-6 h-0.5 rounded-full bg-indigo-400 mt-0.5" />
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
