import {ChangeDetectionStrategy, Component} from '@angular/core'
import {RouterLink} from '@angular/router'
import {LEGAL_CONTACT} from '../legal.constants'

/** Política de privacidad pública (RGPD, art. 13). Accesible sin iniciar sesión. */
@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  templateUrl: './privacy-policy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../legal-page.scss',
})
export class PrivacyPolicyComponent {
  protected readonly contact = LEGAL_CONTACT
}
