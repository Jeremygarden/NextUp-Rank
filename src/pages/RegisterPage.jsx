import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { toFakeEmail, isPhoneInput } from '../lib/phoneAuth'

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/8 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl shadow-black/40 border border-slate-800/50 relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1.5">
            <span className="text-white">NextUp-</span><span className="text-indigo-400">Rank</span>
          </h1>
          <p className="text-slate-400 text-sm">创建账号</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            {!isPhone && <p className="text-green-400 font-medium mb-3">请查收邮件，确认注册后登录</p>}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm">
              前往登录 →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nickname" className="text-slate-300 text-xs font-semibold">昵称</label>
              <input
                id="nickname"
                type="text"
                placeholder="球桌上叫你什么？"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
                className="bg-slate-800 border border-slate-700/50 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="account" className="text-slate-300 text-xs font-semibold">
                手机号或邮箱
                {isPhone && <span className="ml-2 text-indigo-400">手机号</span>}
              </label>
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
              <label htmlFor="password" className="text-slate-300 text-xs font-semibold">密码（至少 6 位）</label>
              <input
                id="password"
                type="password"
                placeholder="请设置密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-slate-800 border border-slate-700/50 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-slate-300 text-xs font-semibold">确认密码</label>
              <input
                id="confirm"
                type="password"
                placeholder="再输一遍"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
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
              {loading ? '创建中...' : '创建账号'}
            </button>
          </form>
        )}

        <p className="text-slate-500 text-sm text-center mt-6">
          已有账号？{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">登录</Link>
        </p>
      </div>
    </div>
  )
}
