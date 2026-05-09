import React, { useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import SquareLayout from '../ui/SquareLayout'
import GlobalTabBar from '../ui/GlobalTabBar'
import usePlazaEvents from '../hooks/usePlazaEvents'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function PlazaPage() {
  const navigate = useNavigate()
  const { matches, loading } = usePlazaEvents()
  const { session } = useContext(AuthContext)

  // 用户切换到广场时刷新在线状态
  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .then(() => {}) // 静默处理，不阻塞
    }
  }, [session?.user?.id])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1">
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
