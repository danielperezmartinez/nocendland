import { Component, ChangeDetectionStrategy } from '@angular/core';
import {SideNavService} from "@shell/state/side-nav.service";
import {HeaderService} from "@shell/state/header.service"
import {NavigationService} from "@shell/navigation/navigation.service"
import {ThemeService} from '@shared/ui/theme'

@Component({
    selector: 'app-header',
    imports: [],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './header.component.scss'
})
export class HeaderComponent {

  constructor(
    protected sideNavService: SideNavService,
    protected headerService: HeaderService,
    protected navigation: NavigationService,
    protected theme: ThemeService,
  ) {
  }
}
