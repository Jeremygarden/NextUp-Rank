import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import LBSHandshakeAnimation from '../ui/LBSHandshakeAnimation'
import GlobalTabBar from '../ui/GlobalTabBar'

export default function JoinMatchPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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
      json._playerB = {
        nickname: userMeta?.nickname || userMeta?.full_name || session?.user?.email?.split('@')[0] || '我',
        rating: userMeta?.rating || 1500,
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
          <LBSHandshakeAnimation
            playerA={success.initiator || { nickname: '对手', rating: 1500 }}
            playerB={success._playerB || { nickname: '我', rating: 1500 }}
            onComplete={() => navigate(`/submit/${success.match_id}`, { state: { matchId: success.match_id } })}
          />
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold mb-2">输入邀请码</h2>
              <p className="text-slate-400 text-sm">请输入对手分享的 6 位邀请码（字母+数字）</p>
            </div>

            {/* Alphanumeric code display boxes */}
            <div className="flex gap-2 mb-6">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-12 h-14 flex items-center justify-center text-xl font-mono font-bold rounded-lg border-2 transition-colors
                  ${code[i] ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200' : 'border-slate-700 bg-slate-900 text-slate-600'}`}>
                  {code[i] || '—'}
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
              className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
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
