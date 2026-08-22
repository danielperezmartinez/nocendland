import { Injectable } from '@angular/core';
import {LOGGER_COLORS, LoggerService} from "@platform/logging/logger.service"

@Injectable({
  providedIn: 'root'
})
export class MathService {

  constructor(private logger: LoggerService) {
    this.logger.setConfig(MathService.name, LOGGER_COLORS.CORE)
  }
  /**
   * Calcula el porcentaje de un valor parcial respecto a un valor total.
   * @param partialValue
   * @param totalValue
   */
  public getPercentage(partialValue: number, totalValue: number): number {
    if (totalValue === 0) {
      this.logger.warn("Total value cannot be zero.");
      return 0
    }
    return (partialValue / totalValue) * 100
  }

  /**
   * Calcula el valor proporcional de un valor por cada 100 unidades.
   * @param valuePer100
   * @param quantity
   */
  public calculateProportionalValue(valuePer100: number, quantity: number): number {
    const result = (valuePer100 * quantity) / 100;
    return isNaN(result) ? 0 : result;
  }
}
