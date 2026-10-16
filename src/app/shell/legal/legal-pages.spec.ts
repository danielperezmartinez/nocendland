import {TestBed} from '@angular/core/testing'
import {provideRouter} from '@angular/router'
import {routes} from '../../app.routes'
import {LegalNoticeComponent} from './legal-notice/legal-notice.component'
import {LEGAL_CONTACT} from './legal.constants'
import {PrivacyPolicyComponent} from './privacy-policy/privacy-policy.component'

describe('Legal pages', () => {
  beforeEach(() => TestBed.configureTestingModule({providers: [provideRouter([])]}))

  it('shows the controller, the processors and the contact in the privacy policy', () => {
    const fixture = TestBed.createComponent(PrivacyPolicyComponent)
    fixture.detectChanges()
    const text = (fixture.nativeElement as HTMLElement).textContent ?? ''

    expect(text).toContain(LEGAL_CONTACT.owner)
    expect(text).toContain(LEGAL_CONTACT.email)
    expect(text).toContain('Supabase')
    expect(text).toContain('Vercel')
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/legal-notice"]')).not.toBeNull()
  })

  it('shows the owner and links the privacy policy from the legal notice', () => {
    const fixture = TestBed.createComponent(LegalNoticeComponent)
    fixture.detectChanges()
    const element = fixture.nativeElement as HTMLElement

    expect(element.textContent).toContain(LEGAL_CONTACT.owner)
    expect(element.querySelector(`a[href="mailto:${LEGAL_CONTACT.email}"]`)).not.toBeNull()
    expect(element.querySelector('a[href="/privacy"]')).not.toBeNull()
  })

  it('serves both pages without the authentication guard', () => {
    for (const path of ['privacy', 'legal-notice']) {
      const route = routes.find(candidate => candidate.path === path)
      expect(route?.loadComponent).toBeDefined()
      expect(route?.canActivate).toBeUndefined()
    }
  })
})
