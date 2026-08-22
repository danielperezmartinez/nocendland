import { Injectable } from '@angular/core';
import {LoggerService} from "@platform/logging/logger.service"

@Injectable({
  providedIn: 'root'
})
export class IntervalService {
  private intervalStorage: Record<string, STORAGE> = {}

  constructor(private logger: LoggerService) {
    this.logger.setConfig('SERVICIO INTERVAL', '#AB87FF')
  }

  /**
   * Crea un intervalo y lo almacena con un nombre asociado para cancelar la siguiente ejecución si fuera necesario.
   * Ver [documentación del type]{@link CORE_INTERVAL_STORAGE} más concretamente [method]{@link CORE_INTERVAL_STORAGE.method}
   * @param newInterval
   */
  public createInterval(newInterval: CORE_INTERVAL_STORAGE): void {
    this.logger.log('Creando nuevo intervalo', newInterval)

    const name: string = newInterval.name
    const method: () => void = newInterval.method
    const interval: number = newInterval.intervalTime

    this.storageInterval(newInterval)

    // Creación de intervalo
    this.intervalStorage[name].id = setInterval(() => {
      if (!this.intervalStorage[name].up) {
        this.logger.error('Método cancelado', method)
        return
      }

      this.intervalStorage[name].up = false
      this.executeMethod(method).finally(() => this.intervalStorage[name].up = true)
    }, interval)
  }

  public destroyInterval(intervalName: string): void {
    let intervalToDestroy: STORAGE | undefined = this.intervalStorage[intervalName]

    if (!intervalToDestroy) {
      this.logger.warn(`El intervalo con nombre ${intervalName} no existe`)
      return
    }

    this.logger.log('Destruyendo intervalo... ', intervalToDestroy)
    clearInterval(intervalToDestroy.id)

    delete this.intervalStorage[intervalName]
  }

  private async executeMethod(method: () => any): Promise<any> {
    return await method()
  }

  private storageInterval(newInterval: CORE_INTERVAL_STORAGE): void {
    if (!!this.intervalStorage[newInterval.name]) {
      this.logger.warn(`Ya hay un intervalo con el nombre ${newInterval.name}. Se va a sobreescribir.`)
      clearInterval(this.intervalStorage[newInterval.name].id)
    }

    this.intervalStorage[newInterval.name] = { interval: newInterval, up: true }
  }
}

type STORAGE = {
  interval: CORE_INTERVAL_STORAGE
  id?: ReturnType<typeof setInterval>
  up: boolean
}

/**
 * Type para el almacenamiento de los intervalos.
 * - [name]{@link CORE_INTERVAL_STORAGE.name}
 * - [method]{@link CORE_INTERVAL_STORAGE.method}
 * - [intervalTime]{@link CORE_INTERVAL_STORAGE.intervalTime}
 */
export type CORE_INTERVAL_STORAGE = {
  name: string
  /**
   * Función que se ejecutará en cada intervalo. Si la función que se le pasa devuelve una promesa, el intervalo no se
   * seguirá ejecutando si dicha promesa aún no se ha resuelto.
   */
  method: () => any
  intervalTime: number
}
