import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { toFakeEmail, isPhoneInput } from '../lib/phoneAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const emailToUse = isPhoneInput(account) ? toFakeEmail(account) : account

    const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password })
    setLoading(false)
    if (error) {
      const msg = error.message?.toLowerCase() || ''
      const friendly =
        msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('email not confirmed')
          ? '手机号/邮箱或密码错误，请重新输入'
          : msg.includes('too many requests') || msg.includes('rate limit')
          ? '请求过于频繁，请稍后再试'
          : msg.includes('user not found') || msg.includes('no user')
          ? '该账号不存在，请先注册'
          : '登录失败，请稍后重试'
      setError(friendly)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Ambient glow — v3 warmth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/8 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl shadow-black/40 border border-slate-800/50 relative">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1.5">
            <span className="text-white">NextUp-</span><span className="text-indigo-400">Rank</span>
          </h1>
          <p className="text-slate-400 text-sm">台球实时积分系统</p>
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="account" className="text-slate-300 text-xs font-semibold">手机号或邮箱</label>
            <input
              id="account"
              type="text"
              inputMode="tel"
              placeholder="手机号 或 you@email.com"
              value={account}
              onChange={e => setAccount(e.target.value)}
              required
              className="bg-slate-800 border border-slate-700/50 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-slate-300 text-xs font-semibold">密码</label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-slate-800 border border-slate-700/50 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold rounded-full py-3.5 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/25 mt-1"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-slate-500 text-sm text-center mt-6">
          没有账号？{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">注册</Link>
        </p>
      </div>
    </div>
  )
}
