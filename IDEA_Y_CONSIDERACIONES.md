# Idea: Web App para Mejora de Dicción en Español

## Visión General
Crear una aplicación web que ayude a hablantes nativos de español a mejorar su dicción, enfocándose específicamente en:
- **Claridad y articulación** (pronunciación precisa de consonantes y vocales)
- **Entonación y ritmo** (melodía y flujo del habla)

La aplicación utilizará ejercicios guiados con retroalimentación visual en tiempo real (highlighting de palabras) como mecanismo principal de feedback en el MVP, dejando el análisis avanzado con IA para fases posteriores.

## Público Objetivo
Hablantes nativos de español que desean mejorar su dicción por razones profesionales, académicas o personales, incluyendo:
- Profesionales que dan presentaciones o lideran reuniones
- Docentes y formadores
- Creadores de contenido (podcasters, YouTubers)
- Estudiantes universitarios
- Cualquier persona interesada en auto-mejora comunicativa

## Propuesta de Valor
- **Feedback inmediato y visual**: Los usuarios ven en tiempo real qué palabra deberían estar diciendo
- **Ejercicios contextualizados**: Uso de lenguaje real (noticias, discursos profesionales) en lugar de oraciones artificiales
- **Enfoque en inteligencia comunicativa**: No solo corrección de sonidos, sino conciencia de cómo el énfasis y ritmo afectan el significado
- **Accesibilidad**: Disponible en navegador sin instalación, usable con micrófono estándar de laptop o headset

## Consideraciones Clave para el Desarrollo

### 1. Enfoque Técnico del MVP
**Priorizar simplicidad y validación rápida:**
- Usar únicamente tecnologías del navegador (Web Speech API) para reconocimiento de voz
- Evitar dependencias complejas o procesamiento de audio avanzado en V1
- Enfocarse en el mecanismo de highlighting de palabra como core innovation
- Dejar el análisis de audio detallado (MFCC, espectral, etc.) y IA para Fase 2

### 2. Selección de Ejercicios para MVP
Elegir ejercicios que:
- Sean representativos de los desafíos reales de dicción en español
- Funcionen bien con el mecanismo de highlighting de palabra
- Permitan métricas objetivas simples de calcular
- Tengan alto valor percibido por usuarios validados

**Ejercicios seleccionados para MVP inicial:**
1. **Minimal Pairs en Contexto Funcional** (/b/-/v/, /ɾ/-/r/)
2. **Lectura con Pacer Visual** (ritmo silábico estable)
3. **Énfasis y Foco Informativo** (cómo cambiar el significado con el prosodio)

### 3. Limitaciones Aceptables del Web Speech API en MVP
Entender y diseñar alrededor de las restricciones:
- Precisión ~85% en condiciones ideales (no 100%)
- Mejor rendimiento con acentos neutros y habla clara
- Sensibilidad al ruido de fondo
- Diferencias entre navegadores (Chrome/Edge óptimos)
- Enfoque en patrones de error más que en corrección palabra por palabra

### 4. Arquitectura de Estado y Persistencia
**Para MVP:**
- `localStorage` para progreso básico (ejercicios completados, fechas, métricas simples)
- Estado en memoria para sesión actual (palabra actual, transcripción intermedia)
- Plan de migración a IndexedDB/Firebase en Fase 2 para historial rico y sincronización

### 5. Consideraciones de UX Críticas
- **Microinteractions:** Feedback visual inmediato (menos de 200ms entre hablar y highlighting)
- **Estados de carga y error:** Manejo explícito de permisos de micrófono y fallos de API
- **Reducción de carga cognitiva:** Interfaz limpia, foco en el ejercicio, mínimas distracciones
- **Accesibilidad:** Contraste suficiente en highlighting, navegación por teclado considerada
- **Mobile-first:** Diseño que funcione bien en navegadores móviles (aunque uso principal podría ser desktop)

## Fases de Desarrollo Propuestas

### Fase 0: Validación Previa (Completada)
- Entrevistas con usuarios objetivo confirmaron dolor específico y interés
- Se definieron los 3 tipos de ejercicio inicial basado en feedback real

### Fase 1: MVP Core (Objetivo actual)
Construir y lanzar una versión con:
- 3 tipos de ejercicio (claridad, ritmo, entonación)
- Highlighting de palabra en tiempo real usando Web Speech API
- Métricas básicas post-ejercicio (precisión, velocidad, palabras problemáticas)
- Almacenamiento local de progreso
- Interfaz limpia y enfocada

### Fase 2: Análisis con IA (Post-MVP)
Añadir:
- Captura de audio crudo con MediaRecorder
- Análisis de características con bibliotecas como meyda (MFCC, espectral, etc.)
- Integración con API de IA para feedback detallado y personalizado
- Ejercicios de refuerzo sugeridos por IA

### Fase 3: Expansión y Comunidad (Largo plazo)
- Biblioteca creciente de ejercicios por tema y dificultad
- Perfiles de usuario con metas personalizadas
- Modos de juego y rachas para motivación
- Integración con calendarios para recordatorios de práctica

## Recomendaciones de Stack Técnico

### Frontend
- **Framework:** React 18 + Vite (desarrollo rápido, HMR, bundle optimizado)
- **Estilado:** Tailwind CSS (utilidad-first, prototipado rápido, tamaño controlado)
- **Estado:** React Hooks useState/useEffect (suficiente para complejidad MVP)
- **Persistencia:** localStorage (MVP), migrable a IndexedDB/Firebase

### Reconocimiento de Voz
- **API Principal:** Web Speech API (SpeechRecognition)
- **Idioma:** es-ES (español de España como estándar neutro inicial)
- **Configuración crítica:** interimResults = true (esencial para highlighting en tiempo real)

### Herramientas de Desarrollo
- **Editor:** VS Code con extensiones ES7+ snippets, ESLint, Prettier
- **Control de versiones:** Git + GitHub
- **Pruebas:** Jest + React Testing Library (para lógica de negocio crítica)
- **Despliegue:** Vercel (plan gratuito, HTTPS automático, CI/CD desde GitHub)

## Métricas de Éxito para MVP Lanzamiento

### Métricas de Adopción
- % de usuarios que completan ejercicios iniciados (>70% objetivo)
- Frecuencia de uso semanal objetivo (>3 veces/semana para usuarios activos)
- Retención a 7 días (>30% de usuarios beta)

### Métricas de Valor Percibido
- Puntuación de utilidad post-ejercicio (≥4/5 en escala 1-5)
- Comentarios cualitativos sobre situaciones específicas de aplicación
- Disposición a pagar indicativa (pregunta en encuesta de salida)

### Métricas de Calidad Técnica
- Tiempo de carga inicial (<3s en conexión mediana)
- Tasa de errores de micrófono manejados gracefully (<5%)
- Compatibilidad verificada en Chrome/Edge última versión

## Próximos Pasos Inmediatos

1. **Setup del repositorio** (git init, estructura de carpetas básica)
2. **Implementación del hook de reconocimiento de voz** (useSpeechRecognition)
3. **Definición de estructuras de datos de ejercicios** (3 tipos iniciales)
4. **Creación del componente ExercisePlayer** con highlighting básico
5. **Construcción del ExerciseSelector y ResultsCard**
6. **Integración y pulido de UX básica**
7. **Pruebas internas rápidas** antes de abrir a usuarios beta

## Riesgos Identificados y Estrategias de Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Precisión insuficiente del ASR | Media | Alto | Enfocar ejercicios en contrastes detectables bien; usar feedback de patrones; permitir corrección manual |
| Users find highlighting distracting | Baja | Medio | Proveer modo prueba; hacer highlighting sutil; permitir ajustar opacidad |
| Falta de motivación para práctica regular | Media | Alto | Diseñar ejercicios <4min; usar contenido relevante; implementar rachas visibles |
| Limitaciones de navegador (Safari/Firefox) | Alta (fuera de MVP) | Bajo | Declarar soporte Chrome/Edge en MVP; planificar polyfills para V2 |
| Expectativas desalineadas sobre IA | Baja | Medio | Comunicar claramente: "V1: ejercicios guiados con feedback visual. IA para análisis personalizado en V2" |

---

*Este documento captura la idea validada y las consideraciones técnicas para construir un MVP enfocado en entregar valor rápidamente mediante un mecanismo de feedback visual simple pero efectivo, dejando análisis avanzado para fases posteriores de validación.*