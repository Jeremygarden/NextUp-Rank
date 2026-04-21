import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { toFakeEmail, isPhoneInput } from '../lib/phoneAuth'

// Shared input style helpers
const inputBase = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #2a2a2a',
  color: '#e8e8e4',
}

export default function RegisterPage() {
  const [nickname, setNickname] = useState('')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const isPhone = isPhoneInput(account)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少 6 位'); return }

    setLoading(true)

    const emailToUse = isPhone ? toFakeEmail(account) : account
    const phoneDigits = isPhone
      ? account.replace(/[\s\-+]/g, '').replace(/^86/, '')
      : null

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailToUse,
      password,
      options: { data: { nickname } }
    })

    if (signUpError) {
      setLoading(false)
      const msg = signUpError.message?.toLowerCase() || ''
      const code = signUpError.status || signUpError.code
      setError(
        msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')
          ? '该账号已注册，请直接登录'
          : msg.includes('invalid') && msg.includes('email')
          ? '账号格式有误，请重新输入'
          : msg.includes('rate limit') || msg.includes('over_email') || code === 429
          ? '注册请求太频繁，请等待 1 分钟后重试'
          : `注册失败：${signUpError.message}`
      )
      return
    }

    if (data?.user && phoneDigits) {
      await supabase.from('users').update({ phone: phoneDigits }).eq('id', data.user.id)
    }

    setLoading(false)
    setSuccess(true)
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
            创建账号
          </p>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center py-4">
              {!isPhone && <p className="font-semibold" style={{ color: '#4a7c59' }}>请查收邮件，确认注册后登录</p>}
              <Link to="/login" className="mt-4 inline-block text-sm font-semibold uppercase tracking-label" style={{ color: '#c45c1a' }}>
                前往登录 →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nickname" className="text-[11px] uppercase tracking-label font-semibold" style={{ color: '#9e9e99' }}>
                  昵称
                </label>
                <input
                  id="nickname"
                  type="text"
                  placeholder="球桌上叫你什么？"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  required
                  className="px-4 py-3 text-sm outline-none transition-colors"
                  style={inputBase}
                  onFocus={e => e.target.style.borderColor = '#c45c1a'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="account" className="text-[11px] uppercase tracking-label font-semibold flex items-center gap-2" style={{ color: '#9e9e99' }}>
                  手机号或邮箱
                  {isPhone && <span className="font-bold" style={{ color: '#c45c1a' }}>📱 手机号</span>}
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
                  style={inputBase}
                  onFocus={e => e.target.style.borderColor = '#c45c1a'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[11px] uppercase tracking-label font-semibold" style={{ color: '#9e9e99' }}>
                  密码（至少 6 位）
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="请设置密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="px-4 py-3 text-sm outline-none transition-colors"
                  style={inputBase}
                  onFocus={e => e.target.style.borderColor = '#c45c1a'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-[11px] uppercase tracking-label font-semibold" style={{ color: '#9e9e99' }}>
                  确认密码
                </label>
                <input
                  id="confirm"
                  type="password"
                  placeholder="再输一遍"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="px-4 py-3 text-sm outline-none transition-colors"
                  style={inputBase}
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
                {loading ? '创建中...' : '创建账号'}
              </button>
            </form>
          )}
        </div>

        <div
          className="px-8 py-4 text-center text-sm"
          style={{ borderTop: '1px solid #1e1e1e', color: '#5c5c58' }}
        >
          已有账号？{' '}
          <Link to="/login" className="font-semibold transition-colors" style={{ color: '#c45c1a' }}>
            登录
          </Link>
        </div>
      </div>
    </div>
  )
}
