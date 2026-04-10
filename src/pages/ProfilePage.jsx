import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ChevronLeft, Info, Pencil, Check, X, LogOut, Camera } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PerformancePulseGraph from '../ui/PerformancePulseGraph'
import GlobalTabBar from '../ui/GlobalTabBar'
import { getRankInfo } from '../lib/rankColor'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRdTip, setShowRdTip] = useState(false)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [nicknameLoading, setNicknameLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState(null)
  const fileInputRef = useRef(null)

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

      const { data: profile, error: userErr } = await supabase
        .from('users')
        .select('nickname, rating, rd, avatar_url')
        .eq('id', userId)
        .maybeSingle()

      if (userErr) throw userErr
      setProfile(profile || { nickname: session.user.email?.split('@')[0] || '玩家', rating: 1500, rd: 200, avatar_url: null })

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

  async function saveNickname() {
    if (!nicknameInput.trim()) return
    setNicknameLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      await supabase.from('users').upsert({ id: userId, nickname: nicknameInput.trim() })
      setProfile(p => ({ ...p, nickname: nicknameInput.trim() }))
      setEditingNickname(false)
    } catch (e) {
      console.error('Failed to save nickname', e)
    } finally {
      setNicknameLoading(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMessage('图片不能超过 2MB')
      return
    }
    setAvatarUploading(true)
    setAvatarMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadErr) {
        if (uploadErr.message?.includes('Bucket not found') || uploadErr.statusCode === 404 || uploadErr.error === 'Bucket not found') {
          setAvatarMessage('头像上传功能暂未开放')
          return
        }
        throw uploadErr
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = urlData?.publicUrl
      await supabase.from('users').upsert({ id: userId, avatar_url: avatarUrl })
      setProfile(p => ({ ...p, avatar_url: avatarUrl }))
      setAvatarMessage(null)
    } catch (e) {
      setAvatarMessage('头像上传功能暂未开放')
      console.error('Avatar upload failed', e)
    } finally {
      setAvatarUploading(false)
    }
  }

  const initials = profile?.nickname ? profile.nickname.slice(0, 2).toUpperCase() : '?'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} aria-label="返回" className="text-slate-400 hover:text-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">我的主页</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {loading ? (
          <div className="animate-pulse space-y-6 pt-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-slate-800" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-32 bg-slate-800 rounded-lg" />
                <div className="h-4 w-20 bg-slate-800 rounded-lg" />
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
              <div className="h-4 w-20 bg-slate-800 rounded mx-auto" />
              <div className="h-16 w-32 bg-slate-800 rounded-xl mx-auto" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-32 bg-slate-900 border border-slate-800 rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchProfile} className="text-indigo-400 underline">重试</button>
          </div>
        ) : profile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Avatar + Info */}
            <div className="flex items-center gap-5 mb-8">
              <div className="relative group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="上传头像"
                  className="w-20 h-20 rounded-full bg-indigo-600/30 border-2 border-indigo-500 flex items-center justify-center text-3xl font-black text-indigo-300 overflow-hidden relative"
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="animate-spin text-indigo-400" size={28} />
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera size={20} className="text-white" />
                  </div>
                </button>
                {avatarMessage && (
                  <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-amber-400">{avatarMessage}</p>
                )}
              </div>
              <div>
                {editingNickname ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={e => setNicknameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setEditingNickname(false) }}
                      autoFocus
                      className="bg-slate-800 text-white text-xl font-bold rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500 w-40"
                    />
                    <button onClick={saveNickname} disabled={nicknameLoading} aria-label="保存昵称" className="text-green-400 hover:text-green-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                      {nicknameLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button onClick={() => setEditingNickname(false)} aria-label="取消编辑" className="text-slate-400 hover:text-slate-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                    <button
                      onClick={() => { setNicknameInput(profile.nickname); setEditingNickname(true) }}
                      aria-label="编辑昵称"
                      className="text-slate-500 hover:text-slate-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-400 text-sm">RD: {Math.round(profile.rd)}</span>
                  <button onClick={() => setShowRdTip(t => !t)} aria-label="了解 RD 含义" className="text-slate-500 hover:text-slate-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
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
              {(() => {
                const rank = getRankInfo(profile.rating)
                return (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
                    style={{ backgroundColor: rank.color + '33', color: rank.color, border: `1px solid ${rank.color}66` }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: rank.color }} />
                    {rank.label}
                  </div>
                )
              })()}
              {profile.rating === 1500 && snapshots.length === 0 && (
                <p className="text-slate-500 text-xs mt-2">初始积分，打完首场后会变化</p>
              )}
            </div>

            {/* Graph */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3 text-slate-300">积分历史</h3>
              {snapshots.length === 0 ? (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                  <p>暂无比赛记录，积分历史将在首场对局后显示</p>
                  <button onClick={() => navigate('/create-match')} className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl transition-colors">去发起对局 →</button>
                </div>
              ) : (
                <PerformancePulseGraph data={graphData} />
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-800/60 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium mt-4 mb-2"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </motion.div>
        )}
      </div>
      <GlobalTabBar />
    </div>
  )
}
