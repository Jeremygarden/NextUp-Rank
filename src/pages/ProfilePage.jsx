import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ChevronLeft, Info, Pencil, Check, X, LogOut, Camera } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PerformancePulseGraph from '../ui/PerformancePulseGraph'
import RecentMatchList from '../ui/RecentMatchList'
import GlobalTabBar from '../ui/GlobalTabBar'
import { getRankInfo } from '../lib/rankColor'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [userId, setUserId] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRdTip, setShowRdTip] = useState(false)
  const [showCalibrationTip, setShowCalibrationTip] = useState(false)
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
      const uid = session?.user?.id
      if (!uid) throw new Error('未登录')
      setUserId(uid)

      const [
        { data: profileData, error: userErr },
        { data: snaps, error: snapErr },
      ] = await Promise.all([
        supabase
          .from('users')
          .select('nickname, rating, rd, avatar_url')
          .eq('id', uid)
          .maybeSingle(),
        supabase
          .from('rating_snapshots')
          .select('rating_before, rating_after, rd_after, created_at, match_id')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(25),
      ])

      if (userErr) throw userErr
      setProfile(profileData || { nickname: session.user.email?.split('@')[0] || '玩家', rating: 1500, rd: 200, avatar_url: null })
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0a', color: '#e8e8e4' }}>
      {/* Page header */}
      <div
        className="flex items-center gap-3 p-4"
        style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#0a0a0a' }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          style={{ color: '#5c5c58' }}
          onMouseEnter={e => e.currentTarget.style.color = '#e8e8e4'}
          onMouseLeave={e => e.currentTarget.style.color = '#5c5c58'}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-industrial" style={{ color: '#e8e8e4' }}>我的主页</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {loading ? (
          <div className="animate-pulse space-y-6 pt-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20" style={{ backgroundColor: '#1e1e1e' }} />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-32" style={{ backgroundColor: '#1e1e1e' }} />
                <div className="h-4 w-20" style={{ backgroundColor: '#1e1e1e' }} />
              </div>
            </div>
            <div className="p-6" style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}>
              <div className="h-4 w-20 mx-auto" style={{ backgroundColor: '#1e1e1e' }} />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-sm font-semibold mb-4" style={{ color: '#8b3a3a' }}>{error}</p>
            <button onClick={fetchProfile} className="text-sm font-semibold uppercase tracking-label" style={{ color: '#c45c1a' }}>重试</button>
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
                  className="w-20 h-20 flex items-center justify-center text-3xl font-black overflow-hidden relative"
                  style={{
                    backgroundColor: '#1e1e1e',
                    border: '2px solid #c45c1a',
                    color: '#9e9e99',
                  }}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="animate-spin" size={28} style={{ color: '#c45c1a' }} />
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <Camera size={20} style={{ color: '#e8e8e4' }} />
                  </div>
                </button>
                {avatarMessage && (
                  <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-label" style={{ color: '#7a6020' }}>
                    {avatarMessage}
                  </p>
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
                      className="text-xl font-bold px-3 py-1 outline-none w-40"
                      style={{ backgroundColor: '#1e1e1e', color: '#e8e8e4', border: '1px solid #c45c1a' }}
                    />
                    <button onClick={saveNickname} disabled={nicknameLoading} aria-label="保存昵称" className="min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" style={{ color: '#4a7c59' }}>
                      {nicknameLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button onClick={() => setEditingNickname(false)} aria-label="取消编辑" className="min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" style={{ color: '#5c5c58' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold" style={{ color: '#e8e8e4' }}>{profile.nickname}</h2>
                    <button
                      onClick={() => { setNicknameInput(profile.nickname); setEditingNickname(true) }}
                      aria-label="编辑昵称"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                      style={{ color: '#5c5c58' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#9e9e99'}
                      onMouseLeave={e => e.currentTarget.style.color = '#5c5c58'}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm" style={{ color: '#5c5c58' }}>RD: {Math.round(profile.rd)}</span>
                  <button onClick={() => setShowRdTip(t => !t)} aria-label="了解 RD 含义" className="min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" style={{ color: '#5c5c58' }}>
                    <Info size={14} />
                  </button>
                </div>
                {showRdTip && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs mt-1 max-w-xs p-2"
                    style={{ color: '#9e9e99', backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}
                  >
                    RD（评级不确定度）越低表示评级越准确，越高表示比赛次数较少，系统对你的评估尚不稳定。
                  </motion.p>
                )}
              </div>
            </div>

            {/* Rating card */}
            <div
              className="px-6 py-4 mb-6 flex items-center justify-between"
              style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}
            >
              <div>
                <p className="text-[11px] uppercase tracking-label font-semibold mb-1" style={{ color: '#5c5c58' }}>当前积分</p>
                {(() => {
                  const rank = getRankInfo(profile.rating)
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-label"
                        style={{ backgroundColor: rank.color + '22', color: rank.color, border: `1px solid ${rank.color}55` }}
                      >
                        <span className="w-1.5 h-1.5 inline-block" style={{ backgroundColor: rank.color }} />
                        {rank.label}
                      </div>
                    </div>
                  )
                })()}
                {snapshots.length < 8 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-label px-2 py-0.5"
                      style={{ backgroundColor: '#7a6020', border: '1px solid #c45c1a', color: '#e07a3a' }}
                    >
                      <span className="w-1.5 h-1.5 inline-block animate-pulse" style={{ backgroundColor: '#c45c1a' }} />
                      定级赛 {snapshots.length}/8
                    </span>
                    <button
                      onClick={() => setShowCalibrationTip(t => !t)}
                      aria-label="了解定级赛"
                      className="transition-colors"
                      style={{ color: '#5c5c58' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    </button>
                  </div>
                )}
                {showCalibrationTip && snapshots.length < 8 && (
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#7a6020' }}>
                    前 8 场为定级赛，积分波动较大，系统正在校准你的真实水平。
                  </p>
                )}
              </div>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
                className="text-4xl font-black font-mono"
                style={{ color: '#c45c1a' }}
              >
                {Math.round(profile.rating)}
              </motion.div>
            </div>

            {/* 7-Day Match History */}
            <div className="mb-6">
              <h3 className="text-[11px] uppercase tracking-label font-semibold mb-3" style={{ color: '#5c5c58' }}>最近 7 天</h3>
              <RecentMatchList userId={userId} />
            </div>

            {/* Graph */}
            <div className="mb-6">
              <h3 className="text-[11px] uppercase tracking-label font-semibold mb-3" style={{ color: '#5c5c58' }}>积分历史</h3>
              {snapshots.length === 0 ? (
                <div className="p-6 text-center" style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}>
                  <p className="text-sm" style={{ color: '#5c5c58' }}>暂无比赛记录，积分历史将在首场对局后显示</p>
                </div>
              ) : (
                <PerformancePulseGraph data={graphData} />
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-industrial transition-colors mt-4 mb-2"
              style={{ border: '1px solid #8b3a3a', color: '#8b3a3a', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#8b3a3a22'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
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
