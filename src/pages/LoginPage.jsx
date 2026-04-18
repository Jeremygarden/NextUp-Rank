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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-sm" style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}>
        {/* Brand header */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <h1
            className="text-2xl font-black uppercase tracking-industrial mb-1"
            style={{ color: '#e8e8e4' }}
          >
            NEXTUP<span style={{ color: '#c45c1a' }}>-RANK</span>
          </h1>
          <p className="text-[11px] uppercase tracking-label font-semibold" style={{ color: '#5c5c58' }}>
            台球实时积分系统
          </p>
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-4 p-8">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="account" className="text-[11px] uppercase tracking-label font-semibold" style={{ color: '#9e9e99' }}>
              手机号或邮箱
            </label>
            <input
              id="account"
              type="text"
              inputMode="tel"
              placeholder="手机号 或 you@email.com"
              value={account}
              onChange={e => setAccount(e.target.value)}
              required
              className="px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #2a2a2a',
                color: '#e8e8e4',
              }}
              onFocus={e => e.target.style.borderColor = '#c45c1a'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[11px] uppercase tracking-label font-semibold" style={{ color: '#9e9e99' }}>
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #2a2a2a',
                color: '#e8e8e4',
              }}
              onFocus={e => e.target.style.borderColor = '#c45c1a'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>
          {error && (
            <p className="text-xs font-semibold uppercase tracking-label px-3 py-2" style={{ color: '#8b3a3a', border: '1px solid #8b3a3a', backgroundColor: '#8b3a3a22' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="py-3 text-sm font-bold uppercase tracking-industrial transition-colors disabled:opacity-50 mt-1"
            style={{ backgroundColor: '#c45c1a', color: '#e8e8e4' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#e07a3a' }}
            onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#c45c1a' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div
          className="px-8 py-4 text-center text-sm"
          style={{ borderTop: '1px solid #1e1e1e', color: '#5c5c58' }}
        >
          没有账号？{' '}
          <Link to="/register" className="font-semibold transition-colors" style={{ color: '#c45c1a' }}>
            注册
          </Link>
        </div>
      </div>
    </div>
  )
}
