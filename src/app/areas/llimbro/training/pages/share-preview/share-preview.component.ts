import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core'
import {ActivatedRoute, Router} from '@angular/router'
import {AuthService} from '@platform/auth/auth.service'
import {AvatarComponent} from '@shared/ui/avatar'
import {ShareRepository} from '../../data-access/share.repository'
import {
  TrainingExercise,
  TrainingShareConflictAction,
  TrainingShareImportResult,
  TrainingSharePreview,
} from '../../models/training.models'
import {TRAINING_WEEKDAYS} from '../../training.constants'

@Component({
  selector: 'app-share-preview',
  imports: [AvatarComponent],
  providers: [ShareRepository],
  templateUrl: './share-preview.component.html',
  styleUrl: './share-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {'data-area': 'training'},
})
export class SharePreviewComponent {
  private readonly token: string
  protected readonly weekdays = TRAINING_WEEKDAYS
  protected readonly preview = signal<TrainingSharePreview | null>(null)
  protected readonly matches = signal<TrainingExercise[]>([])
  protected readonly authenticated = signal(false)
  protected readonly loading = signal(true)
  protected readonly importing = signal(false)
  protected readonly activateSchedule = signal(false)
  protected readonly conflicts = signal<Record<string, TrainingShareConflictAction>>({})
  protected readonly error = signal<string | null>(null)
  protected readonly result = signal<TrainingShareImportResult | null>(null)
  protected readonly exactMatches = computed(() => new Map(this.matches().map(exercise => [exercise.portable_id, exercise])))

  constructor(
    route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly shares: ShareRepository,
  ) {
    this.token = route.snapshot.paramMap.get('token') ?? ''
    void this.load()
  }

  protected nameCollision(portableId: string, name: string): boolean {
    return !this.exactMatches().has(portableId)
      && this.matches().some(exercise => exercise.name.localeCompare(name, undefined, {sensitivity: 'base'}) === 0)
  }

  protected exerciseName(portableId: string): string {
    return this.preview()?.manifest.exercises.find(exercise => exercise.portableId === portableId)?.name ?? 'Ejercicio'
  }

  protected setConflict(portableId: string, event: Event): void {
    const action = (event.target as HTMLSelectElement).value as TrainingShareConflictAction
    this.conflicts.update(conflicts => ({...conflicts, [portableId]: action}))
  }

  protected async importShare(): Promise<void> {
    if (!this.authenticated()) {
      await this.router.navigate(['/auth'], {queryParams: {returnUrl: this.router.url}})
      return
    }
    this.importing.set(true)
    this.error.set(null)
    try {
      this.result.set(await this.shares.import(this.token, {
        activateSchedule: this.activateSchedule(),
        conflicts: this.conflicts(),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      this.error.set(message.includes('schedule_already_imported')
        ? 'Este horario ya está en tu catálogo.'
        : 'No se ha podido importar el contenido. Inténtalo de nuevo.')
    } finally {
      this.importing.set(false)
    }
  }

  protected async openTraining(): Promise<void> {
    await this.router.navigateByUrl('/llimbro/training/schedule')
  }

  private async load(): Promise<void> {
    try {
      const preview = await this.shares.preview(this.token)
      this.preview.set(preview)
      const authenticated = await this.auth.isAuthenticated()
      this.authenticated.set(authenticated)
      if (authenticated) {
        const exercises = preview.manifest.exercises
        const matches = await this.shares.readExerciseMatches(
          exercises.map(exercise => exercise.portableId),
          exercises.map(exercise => exercise.name),
        )
        this.matches.set(matches)
        this.conflicts.set(Object.fromEntries(exercises
          .filter(exercise => matches.some(match => match.portable_id === exercise.portableId))
          .map(exercise => [exercise.portableId, 'keep' as const])))
      }
    } catch {
      this.error.set('Este enlace no existe o ha sido revocado.')
    } finally {
      this.loading.set(false)
    }
  }
}
