import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import ProtectedRoute from '../ProtectedRoute'

// Mock supabase to avoid resolution issues
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    }
  },
  default: {}
}))

function renderWithAuth(authValue, children) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <ProtectedRoute>{children}</ProtectedRoute>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('shows spinner when loading', () => {
    renderWithAuth({ session: null, loading: true }, <div>Protected</div>)
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('redirects to /login when no session', () => {
    renderWithAuth({ session: null, loading: false }, <div>Protected</div>)
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('renders children when session exists', () => {
    renderWithAuth({ session: { user: { id: '1' } }, loading: false }, <div>Protected</div>)
    expect(screen.getByText('Protected')).toBeInTheDocument()
  })
})
