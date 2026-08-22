import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  // Temporizador de debounce.
  private interval: any = undefined
  private timer: number = 0
  private pendingFunc: (() => void) | null = null

  /* CONTROL DE DEBOUNCE */

  /**
   * Ejecuta una función después de un tiempo de espera especificado.
   * Si se llama a debounce nuevamente antes de que se complete el tiempo de espera, se reinicia el temporizador.
   * @param func Función a ejecutar después del tiempo de espera.
   * @param wait Tiempo en milisegundos a esperar antes de ejecutar la función.
   */
  public debounce(func: () => void, wait: number) {
    this.timer = wait
    this.pendingFunc = func

    if (!!this.interval) clearInterval(this.interval)

    this.interval = setInterval(() => {
      if (this.timer === 0) {
        func()
        this.clearDebounce()
      }
      this.timer -= 100
    }, 100)
  }

  /**
   * Cancela el debounce actual, si existe.
   * Si hay una función pendiente, se ejecuta inmediatamente.
   */
  public cancelDebounce() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
    if (this.pendingFunc) {
      this.pendingFunc()
      this.pendingFunc = null
    }
    this.timer = 0
  }

  /**
   * Cancela el debounce actual sin ejecutar la función pendiente.
   * @private
   */
  private clearDebounce() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
    this.pendingFunc = null
    this.timer = 0
  }

  /* OBJETOS */

  /**
   * Aplana el mapa que se le pasa, dejando todas las propiedades en el nivel 0
   * @param object
   */
  public flattenObject(object: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const key in object) {
      const value = object[key]
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value))
      } else {
        result[key] = value
      }
    }

    return result
  }

  /* SUSTITUCIÓN */
  public replaceVariables(config: CORE_UTILS_REPLACE_CONFIG): string | Record<string, any> {
    const marker = config.marker || '%'
    const variables = this.flattenObject(config.variableObject)

    if (typeof config.replacement === 'string') {
      let result = config.replacement
      for (const key in variables) {
        const value = variables[key]
        const regex = new RegExp(`${marker}${key}${marker}`, 'g')
        result = result.replace(regex, value)
      }
      return result
    } else {
      const result = { ...config.replacement } // copia para no mutar el original
      for (const replacementKey in result) {
        if (typeof result[replacementKey] === 'object') result[replacementKey] = this.replaceVariables({replacement: result[replacementKey], variableObject: variables})

        for (const variableKey in variables) {
          const value = variables[variableKey]

          if (result[replacementKey] === `${marker}${variableKey}${marker}`) {
            result[replacementKey] = value
          }
        }
      }
      return result
    }
  }

}

export declare type CORE_UTILS_REPLACE_CONFIG = {
  /**
   * Record dónde se buscará las propiedades marcadas en {@link replacement}
   */
  variableObject: Record<string, any>
  /**
   * Si es un string deberá tener marcas para la sustitución, por ejemplo: %casa%. casa será la clave que se buscará en
   * {@link variableObject}.
   * Si es un Record, deberá tener claves cuyo valor sean referencias a buscar en {@link variableObject}.
   * Este es string u objeto que se devolverá tras el proceso.
   */
  replacement: string | Record<string, any>
  /**
   * Delimitador que se utilizará para buscar en {@link variableObject}.
   * Por defecto: %
   */
  marker?: string
}
