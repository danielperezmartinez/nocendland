import {Injectable} from '@angular/core';
import {NavigationEnd, NavigationExtras, Router} from '@angular/router';
import {filter, Observable} from 'rxjs';

export const APP_ROUTES = {
  home: {segments: [], children: {'': ''}},
  auth: {segments: ['auth'], children: {'': ''}},
  nutrition: {
    segments: ['llimbro', 'nutrition'],
    children: {
      intakes: 'intakes',
      ingredients: 'ingredients',
      'ingredient-form': 'ingredient-form',
      objectives: 'objectives',
    },
  },
  training: {
    segments: ['llimbro', 'training'],
    children: {
      exercises: 'exercises',
      'exercise-form': 'exercise-form',
      schedule: 'schedule',
      tracking: 'tracking',
      measurements: 'measurements',
    },
  },
  miscellaneous: {segments: ['miscellaneous'], children: {'': ''}},
  finances: {segments: ['finances'], children: {'': ''}},
} as const

type AppRoute = keyof typeof APP_ROUTES
type ChildRoute<Route extends AppRoute> = keyof typeof APP_ROUTES[Route]['children']

@Injectable({providedIn: 'root'})
export class NavigationService {
  constructor(private readonly router: Router) {}

  /**
   * Navega a una sección tipada y recuerda la última página visitada dentro de ella.
   */
  public to<Route extends AppRoute, Child extends ChildRoute<Route>>(
    route: Route,
    child?: Child,
    parameter?: string,
    extras?: NavigationExtras,
  ): Promise<boolean> {
    const routeConfig = APP_ROUTES[route]
    const children = routeConfig.children as Record<string, string>
    const rememberedPath = child ? undefined : this.getRememberedPath(route)
    const defaultChild = Object.values(children)[0]
    const selectedChild = child ? children[String(child)] : defaultChild
    const path = rememberedPath ?? [...routeConfig.segments, selectedChild].filter(Boolean)

    if (parameter) path.push(parameter)
    this.rememberPath(route, path)

    return this.router.navigate(path, extras)
  }

  public navigationEnd(): Observable<NavigationEnd> {
    return this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
  }

  public currentUrl(): string {
    return this.router.url
  }

  private rememberPath(route: AppRoute, path: string[]): void {
    localStorage.setItem(this.getStorageKey(route), JSON.stringify(path))
  }

  private getRememberedPath(route: AppRoute): string[] | undefined {
    const storedPath = localStorage.getItem(this.getStorageKey(route))
    if (!storedPath) return undefined

    try {
      const path = JSON.parse(storedPath)
      return Array.isArray(path) ? path : undefined
    } catch {
      localStorage.removeItem(this.getStorageKey(route))
      return undefined
    }
  }

  private getStorageKey(route: AppRoute): string {
    return `navigation-${route}-last-path`
  }
}
