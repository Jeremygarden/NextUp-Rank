import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

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
      if (!res.ok) throw new Error(json.error || '加入失败')
      setSuccess(json)
      setTimeout(() => {
        navigate(`/submit/${json.match_id}`, { state: { matchId: json.match_id } })
      }, 1500)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  function handleDigit(d) {
    if (d === '⌫') {
      setCode(c => c.slice(0, -1))
    } else if (d && code.length < 6) {
      setCode(c => c + d)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">加入对局</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <CheckCircle2 className="text-green-400 mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-bold mb-2">握手成功</h2>
            <p className="text-slate-400">对局已锁定，正在跳转...</p>
          </motion.div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold mb-2">输入邀请码</h2>
              <p className="text-slate-400 text-sm">请输入对手分享的 6 位邀请码</p>
            </div>

            <div className="flex gap-2 mb-8">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-12 h-16 flex items-center justify-center text-2xl font-mono font-black rounded-xl border-2 transition-colors
                  ${code[i] ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 bg-slate-900 text-slate-600'}`}>
                  {code[i] || '·'}
                </div>
              ))}
            </div>

            {/* Text input for alphanumeric invite code */}
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
    </div>
  )
}
