import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function RegisterPage() {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } }
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black tracking-tight mb-1">
            <span className="text-white">NextUp-</span><span className="text-indigo-400">Rank</span>
          </h1>
          <p className="text-slate-500 text-xs tracking-wide">创建账号</p>
        </div>
        {success ? (
          <p className="text-green-400 text-center">请查收邮件，确认注册</p>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="昵称"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
              className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="确认密码"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-3 transition disabled:opacity-50 shadow-lg shadow-indigo-500/30"
            >
              {loading ? '创建中...' : '创建账号'}
            </button>
          </form>
        )}
        <p className="text-slate-400 text-sm text-center mt-4">
          已有账号？{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">登录</Link>
        </p>
      </div>
    </div>
  )
}
