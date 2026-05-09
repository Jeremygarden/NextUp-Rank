import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import LBSHandshakeAnimation from '../ui/LBSHandshakeAnimation'
import GlobalTabBar from '../ui/GlobalTabBar'
import { getRankInfo, getRankGap } from '../lib/rankColor'

export default function JoinMatchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  // rankPreview: show rank gap info before entering animation
  const [rankPreviewDone, setRankPreviewDone] = useState(false)
  const [myRating, setMyRating] = useState(1500)

  async function handleJoin() {
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const userId = session?.user?.id
      const res = await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/match-handshake', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invite_code: code.toUpperCase(), player_b_id: userId }),
      })
      const json = await res.json()
      if (!res.ok) {
        // Normalize common error messages to Chinese
        const rawErr = json.error || '加入失败'
        const friendlyMap = {
          'invite code not found': '邀请码不存在，请确认后重试',
          'invite code expired': '邀请码已过期，请让对手重新创建对局',
          'match already has two players': '该对局已满员',
          'cannot join your own match': '不能加入自己创建的对局',
          'invalid invite code': '邀请码无效，请检查后重试',
          'match not found': '对局不存在或已过期',
          'not found': '邀请码不存在，请确认后重试',
        }
        const lowerErr = rawErr.toLowerCase()
        const friendly = Object.entries(friendlyMap).find(([k]) => lowerErr.includes(k))
        throw new Error(friendly ? friendly[1] : '加入失败，请检查邀请码后重试')
      }
      // Store session user info for animation
      const userMeta = session?.user?.user_metadata
      // Fetch actual rating from DB for rank gap calculation
      const { data: myRow } = await supabase.from('users').select('rating, nickname').eq('id', userId).single()
      const myActualRating = myRow?.rating ?? 1500
      setMyRating(myActualRating)
      json._playerB = {
        nickname: myRow?.nickname || userMeta?.nickname || userMeta?.full_name || session?.user?.email?.split('@')[0] || '我',
        rating: myActualRating,
      }
      setSuccess(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} aria-label="返回" className="text-slate-400 hover:text-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">加入对局</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {success ? (
          rankPreviewDone ? (
          <LBSHandshakeAnimation
            playerA={success.initiator || { nickname: '对手', rating: 1500 }}
            playerB={success._playerB || { nickname: '我', rating: 1500 }}
            onComplete={() => navigate(`/submit/${success.match_id}`, { state: { matchId: success.match_id } })}
          />
          ) : (
            // Rank gap preview card
            <RankPreviewCard
              initiator={success.initiator || { nickname: '对手', rating: 1500 }}
              myRating={myRating}
              onContinue={() => setRankPreviewDone(true)}
            />
          )
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold mb-2">输入邀请码</h2>
              <p className="text-slate-400 text-sm">请输入对手分享的 6 位邀请码（字母+数字）</p>
            </div>

            {/* Alphanumeric code display boxes */}
            <div className="flex gap-1.5 mb-6">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-10 h-12 flex items-center justify-center text-lg font-mono font-bold rounded-lg border-2 transition-colors
                  ${code[i] ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200' : 'border-slate-700 bg-slate-900 text-slate-600'}`}>
                  {code[i] || '·'}
                </div>
              ))}
            </div>

            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="输入邀请码"
              className="w-full max-w-xs text-center text-2xl font-mono font-bold tracking-widest bg-slate-800 border-2 border-slate-600 focus:border-indigo-500 rounded-2xl py-4 px-6 mb-6 outline-none text-slate-100 placeholder-slate-600 uppercase"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl w-full max-w-xs text-center">
                {error}
              </motion.div>
            )}

            <button
              onClick={handleJoin}
              disabled={code.length !== 6 || loading}
              className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-4 rounded-full transition-colors flex items-center justify-center gap-2 text-lg"
            >
              {loading ? <><Loader2 className="animate-spin" size={20} />加入中...</> : '加入对局'}
            </button>
          </>
        )}
      </div>
      <GlobalTabBar />
    </div>
  )
}

/**
 * RankPreviewCard — shown after successful handshake, before LBS animation.
 * Displays opponent rank info and a gap warning if tiers differ significantly.
 */
function RankPreviewCard({ initiator, myRating, onContinue }) {
  const oppRank = getRankInfo(initiator.rating)
  const myRank = getRankInfo(myRating)
  const gap = getRankGap(initiator.rating, myRating)

  const gapMessages = {
    3: { text: '水平差距较大，积分变化会较小', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: '⚠️' },
    2: { text: '水平有一定差距，积分变化会偏小', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: '⚡' },
    1: { text: '水平相近，是场好球！', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: '✅' },
    0: { text: '段位完全相当，势均力敌！', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', icon: '🎯' },
  }
  const gapInfo = gapMessages[gap]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm"
    >
      <h2 className="text-xl font-bold text-center mb-6">对手信息</h2>

      {/* Opponent rank card */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 mb-4">
        <p className="text-slate-300 text-xs mb-3 uppercase tracking-widest">对手</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">{initiator.nickname}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: oppRank.color + '22', color: oppRank.color, border: `1px solid ${oppRank.color}55` }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: oppRank.color }} />
                {oppRank.label}
              </span>
            </div>
          </div>
          {/* 积分盲盒：对局前隐藏对手具体积分，只显示段位 */}
        </div>

        <div className="border-t border-slate-800 mt-4 pt-4 flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-xs mb-1">我</p>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: myRank.color + '22', color: myRank.color, border: `1px solid ${myRank.color}55` }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: myRank.color }} />
                {myRank.label}
              </span>
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-slate-400">{Math.round(myRating)}</span>
        </div>
      </div>

      {/* Gap warning */}
      <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 border mb-6 ${gapInfo.bg}`}>
        <span>{gapInfo.icon}</span>
        <p className={`text-sm font-medium ${gapInfo.color}`}>{gapInfo.text}</p>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-full transition-colors text-lg"
      >
        开始对局 →
      </button>
    </motion.div>
  )
}
