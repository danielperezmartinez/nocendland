import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {RouterOutlet} from "@angular/router";
import {SideNavService} from "@shell/state/side-nav.service";
import {HeaderComponent} from "../header/header.component";
import {UserInfoComponent} from "@shell/layout/user-info/user-info.component";
import {SideNavMenuComponent} from "../side-nav-menu/side-nav-menu.component";
import {ColumnCenterContainerComponent} from '@shared/ui/column-center-container'
import {TooltipDirective} from '@shared/ui/tooltip'
import {environment} from '@environments/environment';
import {AreaThemeService} from '@shell/navigation/area-theme.service'
import {AppUpdateService} from '@platform/browser/app-update.service'

@Component({
    selector: 'app-mainpage',
    imports: [
        RouterOutlet,
        HeaderComponent,
        UserInfoComponent,
        SideNavMenuComponent,
        ColumnCenterContainerComponent,
        TooltipDirective,
    ],
    templateUrl: './mainpage.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './mainpage.component.scss'
})
export class MainpageComponent {

  readonly sideNavService = inject(SideNavService)
  protected readonly appUpdate = inject(AppUpdateService)
  protected readonly activeArea = inject(AreaThemeService).area

  protected readonly environment = environment
}
