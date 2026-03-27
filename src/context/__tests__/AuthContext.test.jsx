import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, AuthContext } from '../AuthContext'

// Mock supabase
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    }
  },
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    }
  }
}))

describe('AuthContext', () => {
  it('provides null session when unauthenticated', async () => {
    let contextValue
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value
            return null
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    )
    await waitFor(() => expect(contextValue?.loading).toBe(false))
    expect(contextValue?.session).toBeNull()
    expect(contextValue?.user).toBeNull()
  })
})
