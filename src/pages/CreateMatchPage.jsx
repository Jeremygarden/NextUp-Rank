import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronLeft, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const GAME_TYPES = [
  { id: '8ball', label: '八球', emoji: '🎱' },
  { id: '9ball', label: '九球', emoji: '🔵' },
  { id: '10ball', label: '十球', emoji: '🟡' },
]

export default function CreateMatchPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [gameType, setGameType] = useState(null)
  const [venues, setVenues] = useState([])
  const [venueLoading, setVenueLoading] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (step === 2) fetchVenues()
  }, [step])

  async function fetchVenues() {
    setVenueLoading(true)
    const { data, error } = await supabase.from('venues').select('id, name')
    setVenueLoading(false)
    if (!error) setVenues(data || [])
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/create-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venue_id: selectedVenue, game_type: gameType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '创建失败')
      setResult(json)
      setStep(4)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} className="text-slate-400 hover:text-slate-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">发起对局</h1>
        <div className="ml-auto flex gap-1">
          {[1,2,3].map(n => (
            <div key={n} className={`h-1 w-8 rounded-full transition-colors ${step >= n ? 'bg-indigo-500' : 'bg-slate-700'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-semibold mb-6">选择游戏类型</h2>
              <div className="grid gap-4">
                {GAME_TYPES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setGameType(g.id); setStep(2) }}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left
                      ${gameType === g.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
                  >
                    <span className="text-4xl">{g.emoji}</span>
                    <div>
                      <div className="text-lg font-bold">{g.label}</div>
                      <div className="text-slate-400 text-sm">{g.id}</div>
                    </div>
                    {gameType === g.id && <Check className="ml-auto text-indigo-400" size={20} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-semibold mb-6">选择球房</h2>
              {venueLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>
              ) : venues.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-6">暂无球房数据</p>
                  <button onClick={() => { setSelectedVenue(null); setStep(3) }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                    跳过，直接创建
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {venues.map(v => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVenue(v.id); setStep(3) }}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
                        ${selectedVenue === v.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
                    >
                      <span className="font-medium">{v.name}</span>
                      {selectedVenue === v.id && <Check className="text-indigo-400" size={18} />}
                    </button>
                  ))}
                  <button onClick={() => { setSelectedVenue(null); setStep(3) }} className="p-4 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-slate-500 transition-colors text-center">
                    不指定球房
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-semibold mb-6">确认创建</h2>
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 mb-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">游戏类型</span>
                  <span className="font-bold">{GAME_TYPES.find(g => g.id === gameType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">球房</span>
                  <span className="font-bold">{venues.find(v => v.id === selectedVenue)?.name || '未指定'}</span>
                </div>
              </div>
              {error && <p className="text-red-400 mb-4 text-sm bg-red-400/10 p-3 rounded-xl">{error}</p>}
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                {loading ? <><Loader2 className="animate-spin" size={20} />创建中...</> : '确认发起对局'}
              </button>
            </motion.div>
          )}

          {step === 4 && result && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mb-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-green-400" size={32} />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">对局已创建</h2>
                <p className="text-slate-400">将邀请码发给对手</p>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
                <p className="text-slate-400 text-sm mb-3">邀请码</p>
                <div className="font-mono text-6xl font-black tracking-widest text-indigo-400 mb-6">
                  {result.invite_code}
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NEXTUP:${result.invite_code}`}
                  alt="QR码"
                  className="w-48 h-48 rounded-xl mx-auto border-4 border-slate-700"
                />
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
