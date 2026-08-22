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
