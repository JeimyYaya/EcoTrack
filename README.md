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
<img width="921" height="652" alt="image" src="https://github.com/user-attachments/assets/fa12c990-fa67-49d7-b86a-fe8b43f68bfd" />


---

### 2.2 Conversión a interfaz tipo chat

Se transformó la interfaz inicial a una experiencia conversacional:

* Mensajes tipo usuario / asistente
* Historial de conversación
* Auto-scroll

📸 Evidencia:
<img width="921" height="537" alt="image" src="https://github.com/user-attachments/assets/5ba92885-e53e-456b-a554-8a870db53c4e" />


---

### 2.3 Extracción de datos desde lenguaje natural

Se implementó un sistema para interpretar el input del usuario:

* Detección de números
* Identificación de actividades (transporte, energía)
* Conversión a formato estructurado

📸 Evidencia:
<img width="921" height="456" alt="image" src="https://github.com/user-attachments/assets/bdc91b34-bfd4-47e6-baac-93935d4ecb24" />


---

### 2.4 Cálculo de emisiones de CO₂

Se mejoró la lógica de cálculo:

* Factores diferenciados por actividad
* Cálculo total en kg de CO₂
* Arquitectura modular

📸 Evidencia:
<img width="921" height="488" alt="image" src="https://github.com/user-attachments/assets/996844cb-ad21-4360-99d5-49edfbf7d173" />


---

### 2.5 Mejora de respuestas tipo IA

Se optimizó la salida del sistema para simular un asistente inteligente:

* Explicación del cálculo
* Sugerencias de reducción
* Tono conversacional

📸 Evidencia:
<img width="921" height="477" alt="image" src="https://github.com/user-attachments/assets/e17ff3d2-e40f-4f3d-8ee1-4ae1d927d493" />


---

## 3. Desafío técnico y solución con IA

Durante el desarrollo, se presentó un desafío relacionado con la interpretación del lenguaje natural, específicamente en la extracción de datos estructurados a partir de texto libre.

El problema consistía en que el sistema no identificaba correctamente algunas actividades o cantidades, lo que afectaba el cálculo final.

Para solucionarlo, se utilizó un prompt en Cursor describiendo el problema y solicitando una mejora en la lógica de extracción. La IA propuso una solución basada en patrones y normalización del texto, mejorando la precisión sin necesidad de escribir código manualmente.


---

## 4. Funcionalidad de IA implementada

**Procesamiento del lenguaje natural**
Se normaliza el texto y se analiza con reglas y expresiones regulares (sin modelo de lenguaje grande).
Se detectan números con unidades y frases típicas de transporte, energía o comida.
No hay comprensión semántica profunda: solo coincidencia de patrones y palabras clave.

**Extracción de datos estructurados**
Se arma un JSON (StructuredFootprint) con actividades: categoría, tipo, cantidad, unidad y texto coincidente.
Se evita duplicar lo mismo si dos patrones se solapan en el mensaje.
Así el mensaje en lenguaje natural pasa a datos tabulares antes del cálculo.

**Cálculo de CO₂**
Cada actividad cuantificada se multiplica por un factor de emisión (p. ej. kg CO₂e por kWh o por vehículo·día).
Lo no cuantificado se completa con reglas por palabras clave y valores “día típico”.
El total en kg CO₂e es la suma de todas las líneas (con piso en cero si aplica).

**Generación de la respuesta**
Se muestran total, desglose y, con plantillas según lo detectado, una breve explicación y 1–2 consejos.
Eso imita el tono de un asistente, pero el texto es determinista, no generado por un LLM.
En conjunto: reglas + factores + texto fijo sustituyen a una IA conversacional real.

---

## 5. Conclusión

El uso de Vibe Coding permitió desarrollar rápidamente un prototipo funcional mediante el uso estratégico de prompts.

En lugar de escribir código manualmente, se priorizó la dirección del sistema y la iteración con IA, lo que facilitó la construcción de una aplicación coherente con la visión inicial del producto.

Este enfoque demuestra cómo las herramientas de IA pueden acelerar significativamente el desarrollo de software en etapas tempranas.
