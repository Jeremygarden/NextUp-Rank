import React from 'react'
import SquareLayout from '../ui/SquareLayout'
import GlobalTabBar from '../ui/GlobalTabBar'
import usePlazaEvents from '../hooks/usePlazaEvents'

export default function PlazaPage() {
  const { matches, loading } = usePlazaEvents()

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1">
        <SquareLayout
          matches={matches}
          loading={loading}
          venueId={null}
          venueName="广场"
          players={[]}
        />
      </div>
      <GlobalTabBar />
    </div>
  )
}
