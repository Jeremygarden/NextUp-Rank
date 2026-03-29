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
    if (code.length !== 4) return
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
        body: JSON.stringify({ invite_code: code, player_b_id: userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '加入失败')
      setSuccess(json)
      setTimeout(() => {
        navigate(`/submit/${json.match_id || json.id}`, { state: { matchId: json.match_id || json.id } })
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
    } else if (d && code.length < 4) {
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
              <p className="text-slate-400 text-sm">请输入对手分享的 4 位邀请码</p>
            </div>

            <div className="flex gap-3 mb-8">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-16 h-20 flex items-center justify-center text-4xl font-mono font-black rounded-2xl border-2 transition-colors
                  ${code[i] ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 bg-slate-900 text-slate-600'}`}>
                  {code[i] || '·'}
                </div>
              ))}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl w-full max-w-xs text-center">
                {error}
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
              {digits.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  className={`h-16 rounded-2xl font-bold text-xl transition-colors
                    ${d === '' ? 'pointer-events-none' : d === '⌫' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-slate-100'}`}
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              onClick={handleJoin}
              disabled={code.length !== 4 || loading}
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
