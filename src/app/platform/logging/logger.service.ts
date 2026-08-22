import { Injectable } from '@angular/core';

export const LOGGER_COLORS = {
  API: '#e4a857',
  FOOTER: '#ad77dc',
  NAVIGATE: '#87ac5a',
  DATA_LIST_COMPONENT: '#5887FF',
  CORE: '#42033D'
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private headerText: string = 'Default'
  private headerColor: string = 'black'

  setConfig(headerText: string, headerColor: string) {
    this.headerText = headerText;
    this.headerColor = headerColor;
  }

  private formatHeader(): string {
    return `%c[${this.headerText}]`;
  }

  private getStyle(): string {
    return `color: ${this.headerColor}; font-weight: bold;`;
  }

  log(...messages: any[]): void {
    console.log(this.formatHeader(), this.getStyle(), ...messages);
  }

  warn(...messages: any[]): void {
    console.warn(this.formatHeader(), this.getStyle(), ...messages);
  }

  error(...messages: any[]): void {
    console.error(this.formatHeader(), this.getStyle(), ...messages);
  }
}
