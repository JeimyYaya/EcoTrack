# EcoTrack AI - Documento de Bitácora

## 1. Introducción

Este proyecto consiste en el desarrollo de un MVP (Producto Mínimo Viable) para EcoTrack AI, una aplicación web que permite a pequeños negocios calcular su huella de carbono mediante lenguaje natural.

El enfoque principal fue utilizar Vibe Coding, delegando la generación y mejora del código a herramientas de inteligencia artificial, enfocándose en la visión del producto más que en la programación manual.

---

## 2. Prompts principales utilizados

### 2.1 Definición del Vibe

Se definió la visión general del proyecto mediante el siguiente prompt:

* Aplicación tipo chat
* Diseño moderno estilo green-tech
* Enfoque en simplicidad y experiencia de usuario

📸 Evidencia:
(Insertar captura 1)

---

### 2.2 Conversión a interfaz tipo chat

Se transformó la interfaz inicial a una experiencia conversacional:

* Mensajes tipo usuario / asistente
* Historial de conversación
* Auto-scroll

📸 Evidencia:
(Insertar captura 2)

---

### 2.3 Extracción de datos desde lenguaje natural

Se implementó un sistema para interpretar el input del usuario:

* Detección de números
* Identificación de actividades (transporte, energía)
* Conversión a formato estructurado

📸 Evidencia:
(Insertar captura 3)

---

### 2.4 Cálculo de emisiones de CO₂

Se mejoró la lógica de cálculo:

* Factores diferenciados por actividad
* Cálculo total en kg de CO₂
* Arquitectura modular

📸 Evidencia:
(Insertar captura 4)

---

### 2.5 Mejora de respuestas tipo IA

Se optimizó la salida del sistema para simular un asistente inteligente:

* Explicación del cálculo
* Sugerencias de reducción
* Tono conversacional

📸 Evidencia:
(Insertar captura 5)

---

## 3. Desafío técnico y solución con IA

Durante el desarrollo, se presentó un desafío relacionado con la interpretación del lenguaje natural, específicamente en la extracción de datos estructurados a partir de texto libre.

El problema consistía en que el sistema no identificaba correctamente algunas actividades o cantidades, lo que afectaba el cálculo final.

Para solucionarlo, se utilizó un prompt en Cursor describiendo el problema y solicitando una mejora en la lógica de extracción. La IA propuso una solución basada en patrones y normalización del texto, mejorando la precisión sin necesidad de escribir código manualmente.

Este proceso evidencia el uso de Vibe Coding, donde el desarrollador actúa como orquestador de soluciones en lugar de implementar directamente la lógica.

---

## 4. Funcionalidad de IA implementada

La aplicación implementa una funcionalidad de procesamiento de lenguaje natural simulado, que permite:

* Interpretar texto libre ingresado por el usuario
* Extraer información estructurada (cantidades y tipos de actividad)
* Calcular emisiones de CO₂ basadas en esos datos
* Generar respuestas explicativas y sugerencias

Aunque no se utiliza una API de IA real, el sistema simula el comportamiento de un modelo inteligente mediante reglas y procesamiento estructurado, cumpliendo con los objetivos del MVP.

---

## 5. Conclusión

El uso de Vibe Coding permitió desarrollar rápidamente un prototipo funcional mediante el uso estratégico de prompts.

En lugar de escribir código manualmente, se priorizó la dirección del sistema y la iteración con IA, lo que facilitó la construcción de una aplicación coherente con la visión inicial del producto.

Este enfoque demuestra cómo las herramientas de IA pueden acelerar significativamente el desarrollo de software en etapas tempranas.
