# EcoTrack

EcoTrack es una aplicación web sencilla para estimar una huella de CO₂ a partir de una descripción en lenguaje natural. Este documento resume la configuración del asistente de desarrollo, los retos habituales al delegar en la IA y la experiencia de *vibe coding* en este proyecto.

## 1. Configuración del agente

El archivo `.cursorrules` define el rol y las reglas de trabajo del agente en el editor. Se estableció un perfil de **desarrollador full-stack experto**, con instrucciones explícitas para favorecer **código limpio, modular y legible**, evitando soluciones innecesariamente complejas. Se prioriza el uso de **frameworks modernos** (por ejemplo Next.js, React o Streamlit), convenciones de nombres claras y comentarios solo cuando aportan valor.

Una pauta relevante es que, **ante errores**, el agente debe **proponer correcciones de forma autónoma** en lugar de limitarse a pedir aclaraciones al usuario. Eso orienta el flujo hacia la resolución práctica: diagnosticar, intentar alternativas y cerrar el ciclo con una propuesta concreta, alineada con buenas prácticas. En conjunto, `.cursorrules` actúa como contrato breve entre la intención del proyecto y el comportamiento esperado de la IA.

## 2. Dificultades encontradas

Delegar la implementación a un asistente no elimina la responsabilidad técnica. Aparecen **fricciones previsibles**: el entorno local (versiones de Node, shell en Windows, restricciones de npm) puede provocar fallos que la IA debe **iterar** hasta resolver. A veces la primera respuesta no es la óptima; hace falta **refinar el prompt** con más contexto o criterios de aceptación.

Otro desafío es la **confianza ciega** en el código generado: conviene revisar lógica de negocio, dependencias y coherencia con el resto del repositorio. La IA puede acelerar el esqueleto y la configuración, pero **validar** (compilación, lint, pruebas manuales) sigue siendo imprescindible. Por último, equilibrar autonomía y control: dejar que proponga arreglos sin micromanagement, pero intervenir cuando el alcance o el estilo se desvían del objetivo.

## 3. Experiencia de Vibe Coding

El *vibe coding* describe el paso de **escribir cada línea a mano** a **orquestar una visión**: describir el producto deseado, prioridades y restricciones, y dejar que el sistema materialice gran parte del trabajo repetitivo o de plantilla. El foco se desplaza hacia **definir intenciones** (qué debe hacer la app, qué calidad se espera) y **guiar** al agente con reglas, revisiones y correcciones puntuales.

En EcoTrack, eso se tradujo en formular el MVP (entrada en lenguaje natural, estimación por palabras clave, interfaz clara) y ajustar el rumbo según el resultado (por ejemplo, reglas de coincidencia de términos o configuración del proyecto). El desarrollador pasa a ser **diseñador de sistema y editor**: menos tecleo mecánico, más criterio sobre arquitectura, riesgos y experiencia de usuario. La transición no sustituye el juicio profesional; lo **reubica** en capas más altas del proceso.

---

*Proyecto académico o de demostración. Las estimaciones de CO₂ son ilustrativas.*
