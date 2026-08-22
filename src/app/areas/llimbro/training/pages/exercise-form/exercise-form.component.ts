import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal} from '@angular/core'
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import {ActivatedRoute} from '@angular/router'
import {NavigationService} from '@shell/navigation/navigation.service'
import {AvatarComponent} from '@shared/ui/avatar'
import {ConfirmDialogService, DialogConfirm} from '@shared/ui/confirm-dialog'
import {ImageCropResult, ImageCropperComponent, ImageCropperConfig} from '@shared/ui/image-cropper'
import {ToastService} from '@shared/ui/toast'
import {exerciseRouteQueryParams, parseExerciseRouteDate, readExerciseRouteContext} from '../../exercise-route-context'
import {TrainingExerciseDraft} from '../../models/training.models'
import {TrainingPendingChanges} from '../../pending-changes.guard'
import {TrainingStore} from '../../state/training.store'
import {
  TRAINING_MODALITIES,
  TRAINING_MOVEMENT_PATTERNS,
  TRAINING_MUSCLE_GROUPS,
  TrainingModality,
  TrainingMovementPattern,
  TrainingMuscleGroup,
} from '../../training.constants'

type ExerciseForm = FormGroup<{
  name: FormControl<string>
  description: FormControl<string>
  videoUrl: FormControl<string>
  trainingModalities: FormControl<TrainingModality[]>
  muscleGroups: FormControl<TrainingMuscleGroup[]>
  movementPatterns: FormControl<TrainingMovementPattern[]>
  tips: FormArray<FormControl<string>>
}>

@Component({
  selector: 'app-exercise-form',
  imports: [ReactiveFormsModule, AvatarComponent, ImageCropperComponent],
  templateUrl: './exercise-form.component.html',
  styleUrl: './exercise-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ExerciseFormComponent implements OnDestroy, TrainingPendingChanges {
  private readonly route = inject(ActivatedRoute)
  private readonly navigation = inject(NavigationService)
  private readonly confirmDialog = inject(ConfirmDialogService)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(TrainingStore)
  protected readonly isNew = signal(this.route.snapshot.params['id'] === 'new')
  protected readonly routeContext = readExerciseRouteContext(this.route.snapshot)
  protected readonly imageUrl = signal<string | null>(null)
  protected readonly cropSource = signal<Blob | string | null>(null)
  protected readonly cropping = computed(() => this.cropSource() !== null)
  protected readonly error = signal<string | null>(null)
  protected readonly modalities = TRAINING_MODALITIES
  protected readonly muscleGroups = TRAINING_MUSCLE_GROUPS
  protected readonly movementPatterns = TRAINING_MOVEMENT_PATTERNS
  protected readonly cropperConfig: ImageCropperConfig = {
    aspectRatio: 1,
    maxOutputWidth: 1024,
    maxOutputHeight: 1024,
    outputMimeType: 'image/webp',
    outputQuality: 0.86,
    altText: 'Encuadrar foto del ejercicio',
  }
  protected readonly form: ExerciseForm = new FormGroup({
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    description: new FormControl('', {nonNullable: true}),
    videoUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^https:\/\/\S+$/i)],
    }),
    trainingModalities: new FormControl<TrainingModality[]>([], {nonNullable: true}),
    muscleGroups: new FormControl<TrainingMuscleGroup[]>([], {nonNullable: true}),
    movementPatterns: new FormControl<TrainingMovementPattern[]>([], {nonNullable: true}),
    tips: new FormArray<FormControl<string>>([]),
  })

  @ViewChild('imageInput') private imageInput?: ElementRef<HTMLInputElement>

  private exerciseId: number | undefined
  private savedImagePath: string | null = null
  private selectedImage: File | undefined
  private imageMarkedForRemoval = false
  private ownedPreviewUrl: string | null = null

  constructor() {
    if (!this.isNew()) void this.loadExercise(Number(this.route.snapshot.params['id']))
  }

  ngOnDestroy(): void {
    this.revokeOwnedPreviewUrl()
  }

  hasPendingChanges(): boolean {
    return this.form.dirty || this.selectedImage !== undefined || this.imageMarkedForRemoval || this.cropping()
  }

  protected get tips(): FormArray<FormControl<string>> {
    return this.form.controls.tips
  }

  protected addTip(value = ''): void {
    this.tips.push(new FormControl(value, {nonNullable: true}))
  }

  protected removeTip(index: number): void {
    this.tips.removeAt(index)
  }

  protected chooseImage(): void {
    this.imageInput?.nativeElement.click()
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      this.error.set('El archivo seleccionado no es una imagen válida.')
      return
    }
    this.error.set(null)
    this.cropSource.set(file)
  }

  protected editImage(): void {
    const source = this.selectedImage ?? this.imageUrl()
    if (source) this.cropSource.set(source)
  }

  protected applyCrop(result: ImageCropResult): void {
    const extension = result.mimeType === 'image/png' ? 'png' : result.mimeType === 'image/jpeg' ? 'jpg' : 'webp'
    this.selectedImage = new File([result.blob], `exercise-image.${extension}`, {type: result.mimeType})
    this.imageMarkedForRemoval = false
    this.revokeOwnedPreviewUrl()
    this.ownedPreviewUrl = URL.createObjectURL(result.blob)
    this.imageUrl.set(this.ownedPreviewUrl)
    this.cropSource.set(null)
  }

  protected cancelCrop(): void {
    this.cropSource.set(null)
  }

  protected removeImage(): void {
    this.selectedImage = undefined
    this.imageMarkedForRemoval = this.savedImagePath !== null
    this.cropSource.set(null)
    this.revokeOwnedPreviewUrl()
    this.imageUrl.set(null)
  }

  protected toggleOption<T extends string>(control: FormControl<T[]>, option: T, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked
    control.setValue(checked
      ? [...control.value, option]
      : control.value.filter(value => value !== option))
    control.markAsDirty()
  }

  protected optionSelected<T extends string>(control: FormControl<T[]>, option: T): boolean {
    return control.value.includes(option)
  }

  protected async save(): Promise<void> {
    this.form.markAllAsTouched()
    if (this.form.invalid) return
    this.error.set(null)
    const draft: TrainingExerciseDraft = {
      id: this.exerciseId,
      name: this.form.controls.name.value,
      description: this.form.controls.description.value || null,
      video_url: this.form.controls.videoUrl.value || null,
      training_modalities: this.form.controls.trainingModalities.value,
      muscle_groups: this.form.controls.muscleGroups.value,
      movement_patterns: this.form.controls.movementPatterns.value,
      tips: this.tips.getRawValue(),
      image_path: this.savedImagePath,
    }

    let savedId: number
    try {
      const saved = await this.store.saveExercise(draft)
      this.exerciseId = saved.id
      savedId = saved.id
      if (!this.selectedImage && !this.imageMarkedForRemoval) {
        this.imageUrl.set(this.store.exercises().find(item => item.id === saved.id)?.imageUrl ?? null)
      }
    } catch {
      const description = 'Revisa los campos e inténtalo de nuevo.'
      this.error.set(`No se han podido guardar los datos del ejercicio. ${description}`)
      this.toast.error('No se pudo guardar el ejercicio', {description})
      return
    }

    try {
      if (this.selectedImage) {
        this.savedImagePath = await this.store.uploadExerciseImage(savedId, this.selectedImage)
      } else if (this.imageMarkedForRemoval) {
        await this.store.removeExerciseImage(savedId)
        this.savedImagePath = null
      }
    } catch {
      const description = this.imageMarkedForRemoval
        ? 'Los datos se han guardado, pero no se ha podido eliminar la imagen. Vuelve a intentarlo.'
        : 'Los datos se han guardado, pero no se ha podido subir la imagen. Vuelve a intentarlo.'
      this.error.set(description)
      this.toast.error('Ejercicio guardado con una incidencia', {description})
      return
    }

    this.selectedImage = undefined
    this.imageMarkedForRemoval = false
    this.isNew.set(false)
    this.form.markAsPristine()
    this.toast.success('Ejercicio guardado', {description: 'La ficha ya está actualizada.'})
    await this.navigation.to('training', 'exercises', String(savedId), {
      queryParams: exerciseRouteQueryParams(this.routeContext),
    })
  }

  protected archive(): void {
    if (!this.exerciseId) return
    const config: DialogConfirm = {
      title: 'Archivar ejercicio',
      message: `Se ocultará ${this.form.controls.name.value} y se retirará del horario. Su historial se conservará.`,
      acceptButton: {text: 'Archivar', show: true, intent: 'danger'},
    }
    this.confirmDialog.open(config).subscribe(confirmed => {
      if (!confirmed || !this.exerciseId) return
      this.form.markAsPristine()
      void this.store.archiveExercise(this.exerciseId)
        .then(() => this.navigation.to('training', 'exercises'))
    })
  }

  protected goBack(): void {
    if (this.routeContext.origin === 'tracking') {
      const date = parseExerciseRouteDate(this.routeContext.date)
      if (date) this.store.selectDate(date)
      void this.navigation.to('training', 'tracking', undefined, {
        queryParams: this.routeContext.date ? {date: this.routeContext.date} : undefined,
      })
      return
    }
    void this.navigation.to('training', 'exercises')
  }

  protected viewSummary(): void {
    if (!this.exerciseId) return
    void this.navigation.to('training', 'exercises', String(this.exerciseId), {
      queryParams: exerciseRouteQueryParams(this.routeContext),
    })
  }

  private async loadExercise(id: number): Promise<void> {
    if (!Number.isInteger(id)) {
      this.goBack()
      return
    }
    try {
      const exercise = await this.store.readExercise(id)
      this.exerciseId = exercise.id
      this.savedImagePath = exercise.image_path
      this.form.controls.name.setValue(exercise.name)
      this.form.controls.description.setValue(exercise.description ?? '')
      this.form.controls.videoUrl.setValue(exercise.video_url ?? '')
      this.form.controls.trainingModalities.setValue(exercise.training_modalities as TrainingModality[])
      this.form.controls.muscleGroups.setValue(exercise.muscle_groups as TrainingMuscleGroup[])
      this.form.controls.movementPatterns.setValue(exercise.movement_patterns as TrainingMovementPattern[])
      exercise.tips.forEach(tip => this.addTip(tip))
      await this.store.loadExercises()
      this.imageUrl.set(this.store.exercises().find(item => item.id === id)?.imageUrl ?? null)
    } catch {
      this.error.set('No se ha podido cargar el ejercicio.')
    }
  }

  private revokeOwnedPreviewUrl(): void {
    if (!this.ownedPreviewUrl) return
    URL.revokeObjectURL(this.ownedPreviewUrl)
    this.ownedPreviewUrl = null
  }
}
