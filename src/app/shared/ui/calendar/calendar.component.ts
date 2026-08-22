import {ChangeDetectionStrategy, Component, computed, input, linkedSignal, output} from '@angular/core'

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  readonly date = input(new Date())
  readonly dateSelected = output<Date>()

  protected readonly currentMonth = linkedSignal(() => this.date().getMonth())
  protected readonly currentYear = linkedSignal(() => this.date().getFullYear())
  protected readonly monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  protected readonly weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  protected readonly daysInMonth = computed(() => Array.from(
    {length: new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate()},
    (_, index) => index + 1,
  ))
  protected readonly emptyDays = computed(() => {
    const firstDayOfMonth = new Date(this.currentYear(), this.currentMonth(), 1).getDay()
    return Array.from({length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1})
  })

  protected prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11)
      this.currentYear.update(year => year - 1)
      return
    }
    this.currentMonth.update(month => month - 1)
  }

  protected nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0)
      this.currentYear.update(year => year + 1)
      return
    }
    this.currentMonth.update(month => month + 1)
  }

  protected selectDay(day: number): void {
    this.dateSelected.emit(new Date(this.currentYear(), this.currentMonth(), day))
  }

  protected isSelectedDay(day: number): boolean {
    const selected = this.date()
    return selected.getFullYear() === this.currentYear()
      && selected.getMonth() === this.currentMonth()
      && selected.getDate() === day
  }
}
