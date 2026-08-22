import {afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, ViewChild} from '@angular/core';

import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NUTRITION_LIMITS, NUTRITION_TEXT} from "@areas/llimbro/nutrition/nutrition.constants";
import {ActivatedRoute} from "@angular/router";
import {AvatarComponent} from '@shared/ui/avatar'
import {ConfirmDialogService, DialogConfirm} from '@shared/ui/confirm-dialog'
import {CssTokenService, ThemeService} from '@shared/ui/theme'
import {ToastService} from '@shared/ui/toast'
import {NutritionIngredient, NutritionIngredientImage} from "@areas/llimbro/nutrition/models/nutrition.models"
import {NutritionStore} from "@areas/llimbro/nutrition/state/nutrition.store"
import {NavigationService} from "@shell/navigation/navigation.service"
import {
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ChartComponent,
} from 'ng-apexcharts'
import {NutritionResourcesService} from "@areas/llimbro/nutrition/services/nutrition-resources.service"

@Component({
    selector: 'app-ingredient-form',
  imports: [
    ReactiveFormsModule,
    AvatarComponent,
    ChartComponent,
],
    templateUrl: './ingredient-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './ingredient-form.component.scss'
})
export class IngredientFormComponent {
  private readonly cssTokens = inject(CssTokenService)
  private readonly theme = inject(ThemeService)
  protected readonly formLabels = NUTRITION_TEXT.ingredients.formLabels
  protected readonly limits = NUTRITION_LIMITS

  protected ingredientForm: FormGroup | undefined
  private ingredientId: number = 0
  protected image: string | null = null
  protected defaultImage: string = ''

  protected new: boolean = false
  protected editing: boolean = false

  @ViewChild('imageInput') imageInput!: ElementRef
  @ViewChild('name') nameField!: ElementRef

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
    protected nutritionStore: NutritionStore,
    private resources: NutritionResourcesService,
    protected navigation: NavigationService,
  ) {
    this.getUrlParam()
    this.buildForm()
    if (!this.new) this.nutritionStore.readIngredient(this.ingredientId).then(ingredient => this.setValues(ingredient))
    afterNextRender(() => {
      if (this.new) document.getElementById('name')?.focus()
    })
    effect(() => {
      this.theme.theme()
      this.updateChartData()
    })
  }

  private getUrlParam(): void {
    const param: string = this.route.snapshot.params['id']
    if (param === 'new') this.new = true
    else this.ingredientId = parseInt(param)
  }

  private buildForm(): void {
    this.ingredientForm = this.formBuilder.group({
      name: ['', Validators.required],
      calories_per_100: [0, [Validators.min(NUTRITION_LIMITS.caloriesPer100.min), Validators.max(NUTRITION_LIMITS.caloriesPer100.max)]],
      proteins_per_100: [0, [Validators.min(NUTRITION_LIMITS.macroPer100.min), Validators.max(NUTRITION_LIMITS.macroPer100.max)]],
      fats_per_100: [0, [Validators.min(NUTRITION_LIMITS.macroPer100.min), Validators.max(NUTRITION_LIMITS.macroPer100.max)]],
      carbohydrates_per_100: [0, [Validators.min(NUTRITION_LIMITS.macroPer100.min), Validators.max(NUTRITION_LIMITS.macroPer100.max)]],
      description: [''],
      grams_per_unit: [0, [Validators.min(NUTRITION_LIMITS.gramsPerUnit.min), Validators.max(NUTRITION_LIMITS.gramsPerUnit.max)]],
      image_route: [this.resources.getRandomDefaultIngredientStoragePath()],
      ...(!this.new && {id: [this.ingredientId, Validators.required]})
    })
  }

  private setValues(ingredient: NutritionIngredient): void {
    if (!ingredient) return
    // Formulario
    this.setFormValues(ingredient)

    // Gráfico
    this.updateChartData()

    // Imagen
    this.setImage()
  }

  private setFormValues(ingredient: NutritionIngredient): void {
    console.log('Setting form values...', ingredient)
    this.ingredientForm?.patchValue(ingredient)
  }

  private setImage(): void {
    // Obtener la imagen del ingrediente si existe.
    const ingredientImage = this.nutritionStore.ingredientImageList().find((image: NutritionIngredientImage) => image.ingredientId === this.ingredientId)
    if (!!ingredientImage) {
      this.image = ingredientImage.src ? URL.createObjectURL(ingredientImage.src) : null
    } else {
      // Si no hay imagen, se asigna una imagen por defecto aleatoria de default-ingredients.
      if (!this.image) {
        console.log('Imagen no encontrada, asignando imagen por defecto')
        this.defaultImage = this.resources.getRandomDefaultImageForIngredient()
        console.log(this.defaultImage)
      }
    }
  }

  public saveIngredient(): void {
    if (this.ingredientForm?.invalid) {
      this.ingredientForm.markAllAsTouched()
      return
    }

    this.nutritionStore.saveIngredient(this.ingredientForm!.value)
      .then(ingredient => {
        this.new = false
        this.buildForm()
        this.setFormValues(ingredient)
        this.toast.success('Alimento guardado', {description: 'La ficha ya está actualizada.'})
      })
      .catch(() => this.toast.error('No se pudo guardar el alimento', {
        description: 'Revisa los datos e inténtalo de nuevo.',
      }))
  }

  public deleteIngredient(): void {
    const config: DialogConfirm = {
      title: 'Eliminar alimento',
      message: `Se va a eliminar el alimento ${this.ingredientForm?.value['name']}`,
      acceptButton: {text: 'Eliminar', show: true, intent: 'danger'},
    }

    this.confirmDialog.open(config).subscribe((deleted: boolean) => {
      if (deleted) this.nutritionStore.deleteIngredients([this.ingredientForm?.value])
        .then(() => {
          this.toast.success('Alimento eliminado')
          return this.navigation.to('nutrition', 'ingredients')
        })
        .catch(() => this.toast.error('No se pudo eliminar el alimento', {
          description: 'Inténtalo de nuevo dentro de unos segundos.',
        }))
    })
  }

  public selectImage(): void {
    this.imageInput.nativeElement.click()
  }

  public async onFileSelected(event: Event): Promise<void> {
    console.log('File selected', event)
    const file = (event.target as HTMLInputElement).files?.[0]

    if (!file) return

    try {
      await this.nutritionStore.saveIngredientImage(this.ingredientForm?.value, file)
      this.setImage()
      this.toast.success('Imagen guardada')
    } catch {
      this.toast.error('No se pudo guardar la imagen', {
        description: 'El resto de datos del alimento no se ha modificado.',
      })
    }
  }


  protected goBack(): void {
    // Si es un nuevo ingrediente o no se está editando, se navega a la lista de ingredientes.
    if (this.new || (!this.new && !this.editing)) {
      this.navigation.to('nutrition', 'ingredients')
    }

    // Si se está editando, se cancela la edición.
    if (this.editing) this.editing = false
  }






  protected readonly chartSeries = signal<ApexNonAxisChartSeries>([0, 0, 0, 0])
  protected readonly chartLabels = ['⚡ Calorías', '🍗 Proteínas', '🥑 Grasas', '🍚 Hidratos']
  protected readonly chart: ApexChart = {
    type: 'donut',
    height: 290,
    toolbar: {show: false},
    background: 'transparent',
  }
  protected readonly chartPlotOptions: ApexPlotOptions = {
    pie: {
      startAngle: -90,
      endAngle: 90,
      expandOnClick: false,
      donut: {size: '62%'},
    },
  }
  protected readonly chartDataLabels: ApexDataLabels = {
    enabled: true,
    formatter: value => `${Math.round(Number(value))} g`,
    style: {fontSize: '12px', fontWeight: 700},
    dropShadow: {enabled: false},
  }
  protected readonly chartLegend: ApexLegend = {
    show: true,
    position: 'bottom',
    fontFamily: 'var(--font-family-body)',
  }
  protected readonly chartTooltip: ApexTooltip = {
    y: {formatter: value => `${value} g`},
  }
  protected readonly chartColors = signal<string[]>([])
  protected readonly chartStroke = signal<ApexStroke>({width: 0})

  private updateChartData(): void {
    if (!this.ingredientForm) return;

    this.chartSeries.set([
      this.ingredientForm.value.calories_per_100 || 0,
      this.ingredientForm.value.proteins_per_100 || 0,
      this.ingredientForm.value.fats_per_100 || 0,
      this.ingredientForm.value.carbohydrates_per_100 || 0,
    ])
    this.chartColors.set([
      this.cssTokens.get('--chart-calories'),
      this.cssTokens.get('--chart-proteins'),
      this.cssTokens.get('--chart-fats'),
      this.cssTokens.get('--chart-carbohydrates'),
    ])
    this.chartStroke.set({
      width: 2,
      colors: [this.cssTokens.get('--color-surface')],
    })
  }

  protected readonly text = NUTRITION_TEXT
}
