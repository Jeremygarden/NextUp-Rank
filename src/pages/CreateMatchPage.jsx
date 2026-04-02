import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronLeft, Check, Copy, MapPin, AlertTriangle, Wifi } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const GAME_TYPES = [
  { id: '8ball', label: '八球', emoji: '🎱' },
  { id: '9ball', label: '九球', emoji: '🔵' },
  { id: '10ball', label: '十球', emoji: '🟡' },
]

// Helper: haversine distance in meters
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Step 2.5: LBS pre-check component
function LBSPreCheck({ selectedVenueId, venues, onPass, onBack }) {
  const [locState, setLocState] = useState('loading') // loading | near | far | error
  const [distance, setDistance] = useState(null)

  const doCheck = useCallback(() => {
    setLocState('loading')
    if (!navigator.geolocation) {
      setLocState('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        // TODO: 从 venues 表读取对应球房的真实坐标
        // 当前使用占位坐标，实际需要从 venues 表查询 lat/lng 字段
        const VENUE_PLACEHOLDER_LAT = 31.2304
        const VENUE_PLACEHOLDER_LNG = 121.4737
        const dist = Math.round(calcDistance(latitude, longitude, VENUE_PLACEHOLDER_LAT, VENUE_PLACEHOLDER_LNG))
        setDistance(dist)
        if (dist < 100) {
          setLocState('near')
          // Auto-advance after brief delay
          setTimeout(onPass, 1200)
        } else {
          setLocState('far')
        }
      },
      () => {
        setLocState('error')
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [onPass])

  useEffect(() => {
    doCheck()
  }, [doCheck])

  const venueName = venues.find(v => v.id === selectedVenueId)?.name || '球房'

  return (
    <motion.div key="step2_5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-xl font-semibold mb-2">位置确认</h2>
      <p className="text-slate-400 text-sm mb-6">确认你当前在 <span className="text-indigo-400 font-medium">{venueName}</span></p>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col items-center gap-5">
        <AnimatePresence mode="wait">
          {locState === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-16 h-16 rounded-full bg-indigo-500/30 absolute inset-0 m-auto"
                />
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center relative z-10">
                  <MapPin className="text-indigo-400" size={28} />
                </div>
              </div>
              <p className="text-slate-300 font-medium">正在定位...</p>
              <p className="text-slate-500 text-xs">请允许浏览器访问你的位置</p>
            </motion.div>
          )}

          {locState === 'near' && (
            <motion.div key="near" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="text-green-400" size={32} />
              </div>
              <p className="text-green-400 font-bold text-lg">✅ 已确认你在球房附近</p>
              <p className="text-slate-400 text-sm">距离 {distance}m，正在进入下一步...</p>
              <Loader2 className="animate-spin text-slate-500" size={18} />
            </motion.div>
          )}

          {locState === 'far' && (
            <motion.div key="far" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 w-full">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="text-amber-400" size={28} />
              </div>
              <div className="text-center">
                <p className="text-amber-400 font-bold mb-1">⚠️ 你距离球房较远（{distance}m）</p>
                <p className="text-slate-400 text-sm">对局不会有 LBS 验证，仍可继续</p>
              </div>
              <div className="flex flex-col gap-3 w-full mt-2">
                <button
                  onClick={onPass}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  继续
                </button>
                <button
                  onClick={onBack}
                  className="w-full border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                >
                  返回选球房
                </button>
              </div>
            </motion.div>
          )}

          {locState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 w-full">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                <MapPin className="text-slate-400" size={28} />
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-medium mb-1">无法获取位置</p>
                <p className="text-slate-500 text-sm">将创建无 LBS 验证的对局</p>
              </div>
              <button
                onClick={onPass}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors mt-2"
              >
                继续
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Step 4: Realtime waiting component
function RealtimeWaiting({ result, navigate }) {
  const [handshakeState, setHandshakeState] = useState('waiting') // waiting | success
  const [opponentName, setOpponentName] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const channelRef = useRef(null)

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(result.invite_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel('plaza_events')
      .on('broadcast', { event: 'HANDSHAKE_SUCCESS' }, ({ payload }) => {
        if (payload?.match_id === result.match_id) {
          setOpponentName(payload?.opponent_name || null)
          setHandshakeState('success')
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [result.match_id])

  return (
    <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      {/* Status indicator */}
      <AnimatePresence mode="wait">
        {handshakeState === 'waiting' ? (
          <motion.div key="waiting-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-indigo-400"
                  />
                ))}
              </div>
              <span className="text-slate-300 font-medium">等待对手扫码加入...</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
              <Wifi size={12} />
              <span>实时监听中</span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <span className="text-3xl">🎯</span>
            </motion.div>
            <p className="text-green-400 font-bold text-xl mb-1">对手已加入！</p>
            {opponentName && <p className="text-slate-400 text-sm">对手：{opponentName}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6">
        <p className="text-slate-400 text-sm mb-3">邀请码</p>
        <div className="font-mono text-6xl font-black tracking-widest text-indigo-400 mb-4">
          {result.invite_code}
        </div>
        <button
          onClick={copyInviteCode}
          className="relative flex items-center justify-center gap-2 mx-auto mb-6 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
        >
          <Copy size={16} /> 复制邀请码
          <AnimatePresence>
            {codeCopied && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -40 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-1/2 -translate-x-1/2 bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1"
              >
                <Check size={12} className="text-emerald-500" /> 已复制
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NEXTUP:${result.invite_code}`}
          alt="QR码"
          className="w-48 h-48 rounded-xl mx-auto border-4 border-slate-700"
        />
      </div>

      {handshakeState === 'success' ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/submit/${result.match_id}`)}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-colors text-lg mb-3"
        >
          🏆 开始比赛
        </motion.button>
      ) : (
        <button onClick={() => navigate('/')} className="w-full border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-3 rounded-2xl transition-colors">
          返回广场
        </button>
      )}
    </motion.div>
  )
}

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

  // Back button handler: step 2.5 → step 2; others normal
  function handleBack() {
    if (step === 2.5) { setStep(2); return }
    if (step > 1) { setStep(s => s - 1); return }
    navigate(-1)
  }

  // Step indicator: map step 2.5 → show as step 2
  const stepDisplay = step === 2.5 ? 2 : step

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button onClick={handleBack} aria-label="返回" className="text-slate-400 hover:text-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">发起对局</h1>
        <div className="ml-auto flex gap-1">
          {[1,2,3].map(n => (
            <div key={n} className={`h-1 w-8 rounded-full transition-colors ${stepDisplay >= n ? 'bg-indigo-500' : 'bg-slate-700'}`} />
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
                      onClick={() => { setSelectedVenue(v.id); setStep(2.5) }}
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

          {step === 2.5 && (
            <LBSPreCheck
              key="step2_5"
              selectedVenueId={selectedVenue}
              venues={venues}
              onPass={() => setStep(3)}
              onBack={() => setStep(2)}
            />
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
              {error && (
                <div className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-xl">
                  <p>创建失败：{error}</p>
                  <button onClick={handleConfirm} className="text-red-300 underline text-xs mt-1">点击重试</button>
                </div>
              )}
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
            <RealtimeWaiting key="step4" result={result} navigate={navigate} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
