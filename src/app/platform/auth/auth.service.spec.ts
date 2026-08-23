import {Router} from '@angular/router'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {AuthService} from './auth.service'

describe('AuthService return paths', () => {
  const service = new AuthService({} as SupabaseClientService, {} as Router)

  it('preserves internal training share links', () => {
    expect(service.sanitizeReturnPath('/share/training/token?source=test#preview'))
      .toBe('/share/training/token?source=test#preview')
  })

  it('rejects external and authentication return paths', () => {
    expect(service.sanitizeReturnPath('https://attacker.example/share')).toBe('/')
    expect(service.sanitizeReturnPath('//attacker.example/share')).toBe('/')
    expect(service.sanitizeReturnPath('/auth/callback')).toBe('/')
  })
})

describe('AuthService profiles', () => {
  it('creates the Nocendland profile for an authenticated user when it is missing', async () => {
    const createdProfile = {
      id: '11111111-1111-4111-8111-111111111111',
      created_at: '2026-08-23T00:00:00Z',
      email: 'user@example.com',
      user_name: 'Nocendland User',
      avatar_url: 'https://example.com/avatar.png',
    }
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({data: createdProfile, error: null}),
      }),
    })
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({data: null, error: null}),
        }),
      }),
      upsert,
    })
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: createdProfile.id,
                email: createdProfile.email,
                user_metadata: {
                  name: createdProfile.user_name,
                  avatar_url: createdProfile.avatar_url,
                },
              },
            },
            error: null,
          }),
        },
        from,
      },
    }
    const service = new AuthService(supabase as unknown as SupabaseClientService, {} as Router)

    await expect(service.isAuthenticated()).resolves.toBe(true)
    expect(upsert).toHaveBeenCalledWith({
      id: createdProfile.id,
      email: createdProfile.email,
      user_name: createdProfile.user_name,
      avatar_url: createdProfile.avatar_url,
    }, {onConflict: 'id'})
    expect(service.user()).toEqual(createdProfile)
  })
})
