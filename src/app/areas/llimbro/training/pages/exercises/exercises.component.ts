import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core'
import {NavigationService} from '@shell/navigation/navigation.service'
import {BadgeConfig} from '@shared/ui/badge'
import {ConfirmDialogService} from '@shared/ui/confirm-dialog'
import {DataListComponent, DataListConfig, DataListItem} from '@shared/ui/data-list'
import {TrainingExerciseListItem} from '../../models/training.models'
import {TrainingStore} from '../../state/training.store'
import {trainingTaxonomyLabels} from '../../training.constants'

@Component({
  selector: 'app-exercises',
  imports: [DataListComponent],
  templateUrl: './exercises.component.html',
  styleUrl: './exercises.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ExercisesComponent {
  protected readonly store = inject(TrainingStore)
  private readonly navigation = inject(NavigationService)
  private readonly confirmDialog = inject(ConfirmDialogService)
  protected readonly selectionMode = signal<'browse' | 'archive' | 'share'>('browse')
  protected readonly archiveMode = computed(() => this.selectionMode() === 'archive')
  protected readonly shareMode = computed(() => this.selectionMode() === 'share')
  protected readonly multipleMode = computed(() => this.selectionMode() !== 'browse')
  protected readonly shareUrl = signal<string | null>(null)
  protected readonly shareError = signal<string | null>(null)
  protected readonly managingShares = signal(false)
  protected readonly items = computed<readonly DataListItem<TrainingExerciseListItem>[]>(() =>
    this.store.exercises().map(exercise => {
      const classifications = trainingTaxonomyLabels([
        ...(exercise.training_modalities ?? []),
        ...(exercise.muscle_groups ?? []),
        ...(exercise.movement_patterns ?? []),
      ])
      return {
        id: exercise.id,
        value: exercise,
        title: exercise.name,
        details: [exercise.description || 'Sin descripción'],
        badges: classifications.map(label => ({
          variant: 'label',
          label,
          status: 'primary',
        }) satisfies BadgeConfig),
        imageUrl: exercise.imageUrl,
        searchText: [
          exercise.name,
          exercise.description,
          ...exercise.tips,
          ...classifications,
        ].filter(Boolean).join(' '),
      }
    }),
  )
  protected readonly config: DataListConfig<TrainingExerciseListItem> = {
    label: 'Ejercicios',
    actions: {
      reload: () => this.store.loadExercises(),
      confirm: exercises => this.handleSelection(exercises),
    },
    multiple: this.multipleMode,
    showSelectionConfirmation: true,
    confirmationIcon: 'delete',
    loading: this.store.loadingExercises,
  }

  protected openForm(id: number | 'new'): void {
    void this.navigation.to('training', 'exercise-form', String(id))
  }

  protected openDetail(id: number): void {
    void this.navigation.to('training', 'exercises', String(id), {queryParams: {from: 'exercises'}})
  }

  protected toggleArchiveMode(): void {
    this.selectionMode.update(mode => mode === 'archive' ? 'browse' : 'archive')
  }

  protected toggleShareMode(): void {
    this.selectionMode.update(mode => mode === 'share' ? 'browse' : 'share')
  }

  protected async shareAll(): Promise<void> {
    await this.createShare(this.store.exercises())
  }

  protected async copyShareUrl(url = this.shareUrl()): Promise<void> {
    if (!url) return
    try {
      await globalThis.navigator.clipboard.writeText(url)
    } catch {
      this.shareError.set('Copia el enlace manualmente desde el campo.')
    }
  }

  protected revokeShare(shareId: string): void {
    this.confirmDialog.open({
      title: 'Revocar enlace',
      message: 'El enlace dejará de funcionar. Las copias ya importadas no se modificarán.',
      acceptButton: {text: 'Revocar', show: true, intent: 'danger'},
    }).subscribe(confirmed => {
      if (confirmed) void this.store.revokeShare(shareId)
    })
  }

  private handleSelection(exercises: readonly TrainingExerciseListItem[]): void {
    if (this.selectionMode() === 'browse') {
      const exercise = exercises[0]
      if (exercise) this.openDetail(exercise.id)
      return
    }
    if (this.selectionMode() === 'share') {
      void this.createShare(exercises)
      return
    }
    void Promise.all(exercises.map(exercise => this.store.archiveExercise(exercise.id)))
      .finally(() => this.selectionMode.set('browse'))
  }

  private async createShare(exercises: readonly TrainingExerciseListItem[]): Promise<void> {
    this.shareError.set(null)
    try {
      const share = await this.store.shareExercises(exercises.map(exercise => exercise.id))
      const url = new URL(`/share/training/${share.token}`, globalThis.location.origin).toString()
      this.shareUrl.set(url)
      this.selectionMode.set('browse')
      await this.copyShareUrl(url)
    } catch {
      this.shareError.set('No se ha podido crear el enlace compartido.')
    }
  }
}
