import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ChevronLeft, Info } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PerformancePulseGraph from '../ui/PerformancePulseGraph'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRdTip, setShowRdTip] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) throw new Error('未登录')

      // Auto-upsert: new auth users may not have a row in users table yet
      const { data: user, error: userErr } = await supabase
        .from('users')
        .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
        .select('nickname, rating, rd')
        .maybeSingle()

      // If upsert+select didn't return data, do a plain select
      let profile = user
      if (!profile && !userErr) {
        const { data: fallback } = await supabase
          .from('users')
          .select('nickname, rating, rd')
          .eq('id', userId)
          .maybeSingle()
        profile = fallback
      }

      if (userErr) throw userErr
      setProfile(profile || { nickname: session.user.email?.split('@')[0] || '未命名', rating: 1500, rd: 200 })

      const { data: snaps, error: snapErr } = await supabase
        .from('rating_snapshots')
        .select('rating_before, rating_after, rd_after, created_at, match_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25)
      if (!snapErr) setSnapshots((snaps || []).reverse())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const graphData = snapshots.length > 0
    ? snapshots.map((s, i) => ({
        matchIndex: i + 1,
        rating: Math.round(s.rating_after),
        weight: Math.exp(-0.1 * (snapshots.length - (i + 1))),
      }))
    : null

  const initials = profile?.nickname ? profile.nickname.slice(0, 2).toUpperCase() : '?'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">我的主页</h1>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-400" size={40} /></div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchProfile} className="text-indigo-400 underline">重试</button>
          </div>
        ) : profile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Avatar + Info */}
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-full bg-indigo-600/30 border-2 border-indigo-500 flex items-center justify-center text-3xl font-black text-indigo-300">
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-400 text-sm">RD: {Math.round(profile.rd)}</span>
                  <button onClick={() => setShowRdTip(t => !t)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <Info size={14} />
                  </button>
                </div>
                {showRdTip && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-slate-400 mt-1 max-w-xs bg-slate-800 p-2 rounded-lg">
                    RD（评级不确定度）越低表示评级越准确，越高表示比赛次数较少，系统对你的评估尚不稳定。
                  </motion.p>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 mb-6 text-center">
              <p className="text-slate-400 text-sm mb-2">当前积分</p>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
                className="text-6xl font-black font-mono text-indigo-400"
              >
                {Math.round(profile.rating)}
              </motion.div>
            </div>

            {/* Graph */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3 text-slate-300">积分历史</h3>
              {snapshots.length === 0 ? (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                  暂无比赛记录，积分历史将在首场对局后显示
                </div>
              ) : (
                <PerformancePulseGraph data={graphData} />
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
