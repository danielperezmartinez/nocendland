import {ChangeDetectionStrategy, Component} from '@angular/core'
import {RouterLink} from '@angular/router'
import {LEGAL_CONTACT} from '../legal.constants'

/** Aviso legal público (LSSI-CE, art. 10). Accesible sin iniciar sesión. */
@Component({
  selector: 'app-legal-notice',
  imports: [RouterLink],
  templateUrl: './legal-notice.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../legal-page.scss',
})
export class LegalNoticeComponent {
  protected readonly contact = LEGAL_CONTACT
}
