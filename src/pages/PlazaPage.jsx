import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SquareLayout from '../ui/SquareLayout'
import GlobalTabBar from '../ui/GlobalTabBar'
import usePlazaEvents from '../hooks/usePlazaEvents'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Swords } from 'lucide-react'

function ActiveMatchBanner({ match, navigate }) {
  if (!match) return null
  const statusLabel = {
    locked: '对局已匹配，进入比赛',
    awaiting_confirmation: '等待比分确认',
    processing: '比分结算中',
  }[match.status] || '进行中'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 mb-0"
    >
      <button
        onClick={() => navigate(`/submit/${match.id}`)}
        className="w-full flex items-center gap-3 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl px-4 py-3 hover:bg-indigo-600/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <Swords size={16} className="text-indigo-400" />
        </div>
        <div className="text-left flex-1">
          <p className="text-indigo-300 text-sm font-bold">你有一场进行中的对局</p>
          <p className="text-indigo-400/70 text-xs">{statusLabel} — 点击继续</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
      </button>
    </motion.div>
  )
}

export default function PlazaPage() {
  const navigate = useNavigate()
  const { matches, loading } = usePlazaEvents()
  const [activeMatch, setActiveMatch] = useState(null)

  useEffect(() => {
    async function fetchActiveMatch() {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      const { data } = await supabase
        .from('matches')
        .select('id, status, match_metadata')
        .or(`player_a_id.eq.${userId},player_b_id.eq.${userId}`)
        .in('status', ['locked', 'awaiting_confirmation', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setActiveMatch(data || null)
    }
    fetchActiveMatch()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1">
        <ActiveMatchBanner match={activeMatch} navigate={navigate} />
        <SquareLayout
          matches={matches}
          loading={loading}
          venueId={null}
          venueName="广场"
          players={[]}
        />
      </div>
      <GlobalTabBar />
    </div>
  )
}
