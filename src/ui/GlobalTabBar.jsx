import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Swords, User } from 'lucide-react'

const TABS = [
  { path: '/', label: '广场', icon: Home },
  { path: '/create-match', label: '发起对局', icon: Swords },
  { path: '/profile', label: '我的', icon: User },
]

export default function GlobalTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-50">
      <div className="flex">
        {TABS.map(({ path, label, icon: Icon }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            >
              <Icon
                size={22}
                className={active ? 'text-indigo-400' : 'text-slate-500'}
              />
              <span
                className={`text-xs font-medium ${active ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                {label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
