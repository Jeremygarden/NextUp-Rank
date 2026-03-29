import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronLeft, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function Counter({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
          <Minus size={20} />
        </button>
        <span className="text-5xl font-black font-mono w-16 text-center tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}

export default function SubmitResultPage() {
  const navigate = useNavigate()
  const { matchId: paramMatchId } = useParams()
  const { state } = useLocation()
  const matchId = paramMatchId || state?.matchId

  const [racksWon, setRacksWon] = useState(0)
  const [racksLost, setRacksLost] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/process-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ match_id: matchId, racks_won: racksWon, racks_lost: racksLost }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '提交失败')
      setResult(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const delta = result ? (result.rating_after - result.rating_before) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">提交比赛结果</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
                <div className="flex justify-around">
                  <Counter label="我赢的局数" value={racksWon} onChange={setRacksWon} />
                  <div className="w-px bg-slate-700 self-stretch mx-2" />
                  <Counter label="对手赢的局数" value={racksLost} onChange={setRacksLost} />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl text-center">
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || (racksWon === 0 && racksLost === 0)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                {loading ? <><Loader2 className="animate-spin" size={20} />提交中...</> : '确认提交'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full max-w-sm">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${delta >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}
              >
                {delta >= 0
                  ? <TrendingUp className="text-green-400" size={40} />
                  : <TrendingDown className="text-red-400" size={40} />
                }
              </motion.div>

              <h2 className="text-2xl font-bold mb-6">结果已提交</h2>

              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400">积分变化</span>
                  <motion.span
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                    className={`text-2xl font-black font-mono ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {delta >= 0 ? '+' : ''}{Math.round(delta)}
                  </motion.span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">新积分</span>
                  <motion.span
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="text-3xl font-black font-mono text-indigo-400"
                  >
                    {Math.round(result.rating_after)}
                  </motion.span>
                </div>
              </div>

              <button onClick={() => navigate('/')} className="w-full border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-3 rounded-2xl transition-colors">
                返回广场
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
