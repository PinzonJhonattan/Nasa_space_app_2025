# Resumen de la Aplicación: AstroChiguis

AstroChiguis es una aplicación diseñada para ayudar a los usuarios a planificar actividades al aire libre y otras tareas sensibles al clima, proporcionando pronósticos meteorológicos detallados y recomendaciones personalizadas basadas en inteligencia artificial.

## Funcionalidades Principales

### 1. Predicción y Consulta Climática

La aplicación permite a los usuarios predecir el clima en una ubicación específica y en un tramo horario determinado. Utiliza geolocalización para obtener la ubicación del usuario o permite la selección manual en un mapa. Los datos climáticos se obtienen de la API de Open-Meteo y incluyen:

*   **Temperatura** (a 2 metros)
*   **Humedad relativa** (a 2 metros)
*   **Velocidad del viento** (a 10 metros)
*   **Precipitación**

El pronóstico está disponible para un rango de hasta **15 días** a partir de la fecha actual, permitiendo una planificación a corto y mediano plazo.

### 2. Gestión de Actividades

La aplicación ofrece un conjunto de actividades predefinidas y la capacidad de añadir actividades personalizadas.

**Actividades Predefinidas:**
*   **Deporte:** Hiking, Fishing (Pesca), Open Water Swimming (Natación en aguas abiertas)
*   **Agricultura:** Irrigation (Riego), Harvesting (Cosecha), Livestock Care (Cuidado del ganado)
*   **Transporte:** Flight Planning (Planificación de vuelos), Road Trips (Viajes por carretera)
*   **Turismo:** Camping, Sightseeing (Turismo)

**Actividades Personalizadas:**
Los usuarios pueden crear sus propias actividades proporcionando un título, descripción e imagen. Pueden seleccionar una categoría existente o añadir una nueva. Estas actividades se gestionan a través de `ActivityConfigService` y se guardan localmente en el `localStorage` del navegador, asegurando su persistencia.

### 3. Chatbot Inteligente

Un chatbot avanzado, impulsado por el modelo de IA Gemini, proporciona recomendaciones personalizadas sobre las actividades en función de las condiciones meteorológicas. Sus capacidades incluyen:

*   **Contexto Inteligente:** El chatbot recibe información contextual detallada, incluyendo la fecha, hora, actividad, datos climáticos específicos (temperatura, humedad, viento, precipitación) y "factores de incomodidad" (probabilidad de frío, calor, viento, humedad o lluvia excesivos). También considera las particularidades de cada actividad.
*   **Recomendaciones Claras:** Ofrece una recomendación inicial y concisa (✅ Recomendable / ⚠️ Precaución / ❌ No recomendable).
*   **Consejos Prácticos:** Proporciona un razonamiento, consejos útiles, sugerencias sobre qué llevar o evitar, y mantiene un tono conversacional y preciso.
*   **Sugerencias Rápidas:** Facilita la interacción con preguntas predefinidas como "¿Cómo estará el clima?" o "¿Qué ropa recomiendas?".

En resumen, AstroChiguis es una herramienta completa para la planificación de actividades, combinando pronósticos meteorológicos precisos con inteligencia artificial para ofrecer una experiencia de usuario optimizada y personalizada.
