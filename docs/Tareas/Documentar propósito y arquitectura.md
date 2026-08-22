---
Nombre: Documentar propósito y arquitectura
Estado: Hecha
Resumen: El README de la bóveda documenta el propósito de Nocendland, su taxonomía, arquitectura modular, dependencias, estado, datos, autenticación y despliegue.
Decisiones: La arquitectura definitiva es un monolito modular frontend por áreas y features; el término módulo no se usa como nivel funcional para evitar confundirlo con NgModule.
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-08-06T19:19:09
---

# Documentar propósito y arquitectura

## Contexto

La migración a Angular 22 ya se ha realizado, pero falta el refactor que determinará la estructura objetivo. La documentación definitiva debe reflejar el resultado, no consolidar accidentalmente decisiones heredadas.

## Alcance

- Explicar el propósito funcional del producto y sus dominios principales.
- Describir la arquitectura de frontend, acceso a datos, autenticación y despliegue.
- Identificar los límites entre módulos, servicios y estado.
- Enlazar las decisiones de arquitectura que deban mantenerse.

## Criterios de finalización

- Una persona o agente nuevo puede entender qué hace el proyecto y cómo está organizado.
- La documentación coincide con el código posterior al refactor.
- Las reglas y decisiones tienen una única fuente de verdad dentro de la bóveda.

## Resultado

La documentación consolidada vive en [[../README|README de la bóveda]]. Describe el producto, la arquitectura implementada y las reglas que debe aplicar cualquier agente, sin duplicarlas en `AGENTS.md`.
