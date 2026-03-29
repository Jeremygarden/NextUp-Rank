import React from 'react'
import { useNavigate } from 'react-router-dom'
import SquareLayout from '../ui/SquareLayout'
import { Swords, QrCode, User } from 'lucide-react'

export default function PlazaPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1">
        <SquareLayout
          matches={[]}
          loading={false}
          venueId="demo"
          venueName="本地球房"
          players={[]}
        />
      </div>

      {/* Bottom nav bar */}
      <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-4 py-3">
        <div className="flex gap-3 max-w-sm mx-auto">
          <button
            onClick={() => navigate('/create-match')}
            className="flex-1 flex flex-col items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-2xl transition-colors"
          >
            <Swords size={20} />
            <span className="text-xs">发起对局</span>
          </button>
          <button
            onClick={() => navigate('/join')}
            className="flex-1 flex flex-col items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-3 px-4 rounded-2xl transition-colors"
          >
            <QrCode size={20} />
            <span className="text-xs">加入对局</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex-1 flex flex-col items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-3 px-4 rounded-2xl transition-colors"
          >
            <User size={20} />
            <span className="text-xs">我的</span>
          </button>
        </div>
      </div>
    </div>
  )
}
