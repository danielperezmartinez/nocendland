import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DeviceService} from '@platform/browser/device.service'
import {AppUpdateService} from '@platform/browser/app-update.service'
import {AreaThemeService} from '@shell/navigation/area-theme.service'
import {ToastOutletComponent} from '@shared/ui/toast'

@Component({
    selector: 'app-root',
  imports: [RouterOutlet, ToastOutletComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly title = 'nocendland'

  private readonly device = inject(DeviceService)
  private readonly areaTheme = inject(AreaThemeService)
  protected readonly appUpdate = inject(AppUpdateService)
}
