import {Component, ChangeDetectionStrategy} from '@angular/core';

import {SideNavService} from "@shell/state/side-nav.service";
import {NavigationService} from "@shell/navigation/navigation.service"

@Component({
    selector: 'app-side-nav-menu',
  imports: [],
    templateUrl: './side-nav-menu.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './side-nav-menu.component.scss'
})
export class SideNavMenuComponent {
  readonly menuItems: SideNavCategory[] = [
    {
      area: 'llimbro',
      title: 'Llimbro',
      buttons: [
        {title: 'Ejercicios', description: 'Control básico de ejercicios', icon: 'fitness_center', action: () => this.open('training', 'exercises')},
        {title: 'Alimentación', description: 'Calorías y control de la comida', icon: 'fastfood', action: () => this.open('nutrition')},
      ],
    },
    {
      area: 'finances',
      title: 'Finanzas',
      buttons: [
        {title: 'Abrir área', description: 'Dinero, planificación y patrimonio personal', icon: 'account_balance_wallet', action: () => this.open('finances')},
      ],
    },
    {
      area: 'miscellaneous',
      title: 'Miscelánea',
      buttons: [
        {title: 'Abrir área', description: 'Ideas y utilidades que no encajan en otro lugar', icon: 'category', action: () => this.open('miscellaneous')},
      ],
    },
  ]

  constructor(private navigation: NavigationService, private sideNav: SideNavService) {}

  private async open(route: 'nutrition' | 'training' | 'miscellaneous' | 'finances', child?: 'exercises'): Promise<void> {
    if (route === 'training') await this.navigation.to('training', child ?? 'exercises')
    else if (route === 'nutrition') await this.navigation.to('nutrition')
    else await this.navigation.to(route)
    this.sideNav.close()
  }

}

interface SideNavButton {
  title: string
  description: string
  icon: string
  action: () => void | Promise<void>
}

interface SideNavCategory {
  area: 'llimbro' | 'miscellaneous' | 'finances'
  title: string
  buttons: SideNavButton[]
}
