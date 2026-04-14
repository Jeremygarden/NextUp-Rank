import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const PHONE_DOMAIN = 'nextup-rank.phone'

function toFakeEmail(phone) {
  // Normalize: strip spaces/dashes, ensure +86 prefix for mainland
  const digits = phone.replace(/[\s\-]/g, '')
  const normalized = digits.startsWith('+') ? digits : `+86${digits}`
  return `${normalized}@${PHONE_DOMAIN}`
}

function isPhoneInput(value) {
  // Treat as phone if it's all digits (possibly with leading +/spaces)
  return /^[+\d\s\-]{7,15}$/.test(value.trim())
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState('') // phone or email
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const emailToUse = isPhoneInput(account)
      ? toFakeEmail(account)
      : account

    const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password })
    setLoading(false)
    if (error) {
      const msg = error.message?.toLowerCase() || ''
      const friendly = msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('email not confirmed')
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
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black tracking-tight mb-1">
            <span className="text-white">NextUp-</span><span className="text-indigo-400">Rank</span>
          </h1>
          <p className="text-slate-500 text-xs tracking-wide">台球实时积分系统</p>
        </div>
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="account" className="text-slate-400 text-xs font-medium">手机号或邮箱</label>
            <input
              id="account"
              type="text"
              inputMode="tel"
              placeholder="138 0000 0000"
              value={account}
              onChange={e => setAccount(e.target.value)}
              required
              className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-slate-400 text-xs font-medium">密码</label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-3 transition disabled:opacity-50 shadow-lg shadow-indigo-500/30"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="text-slate-400 text-sm text-center mt-4">
          没有账号？{' '}
          <Link to="/register" className="text-indigo-400 hover:underline">注册</Link>
        </p>
      </div>
    </div>
  )
}
