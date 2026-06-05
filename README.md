# Qallu

Aplicación web para mejorar la dicción en español. Usa el micrófono del navegador para darte feedback visual en tiempo real mientras practicas: cada palabra se resalta según la reconoces, y al terminar puedes escuchar lo que dijiste.

> **Navegador requerido:** Chrome o Edge. La Web Speech API no funciona en Firefox ni Safari.

## Ejercicios

### Pares Mínimos
Practica contrastes fonéticos (/b/–/v/, /ɾ/–/r/) en oraciones naturales. Las palabras objetivo se resaltan para que te concentres en los sonidos que más diferencian significados.

### Pacer Visual
Lee un texto siguiendo el ritmo de un resaltado automático que avanza a la velocidad silábica objetivo. Entrena la cadencia y evita acelerar en palabras fáciles o ralentizar en las difíciles.

### Énfasis y Foco
La misma oración, repetida cambiando qué palabra se enfatiza. Ejercita cómo la prosodia cambia el significado comunicativo.

### Trabalenguas
Cuatro trabalenguas de dificultad progresiva, cada uno dividido en tres frases que construyen hasta la versión completa.

## Feedback post-ejercicio

Al terminar cada ejercicio se muestra:
- Precisión por segmento (oración, ronda o texto completo)
- Palabras con error resaltadas
- Botón **▶ Escuchar** para reproducir el audio de lo que dijiste en cada parte

## Stack

- React 18 + Vite
- Tailwind CSS
- Web Speech API (`webkitSpeechRecognition`, `es-ES`)
- MediaRecorder API (grabación de audio por segmento)
- `localStorage` para persistencia de progreso (sin backend)

## Desarrollo local

```bash
npm install
npm run dev       # servidor en localhost:5173
npm run build     # build de producción en dist/
npm run lint      # ESLint sobre src/
```

## Arquitectura resumida

| Archivo | Responsabilidad |
|---|---|
| `src/hooks/useSpeechRecognition.js` | Loop de reconocimiento continuo + MediaRecorder por segmento |
| `src/hooks/useExerciseSession.js` | Máquina de estados del ejercicio (`idle → active → completed`) |
| `src/utils/wordMatcher.js` | Matching normalizado (NFD, sin puntuación, ventana deslizante) |
| `src/components/WordHighlighter.jsx` | 4 estados visuales: pendiente, activo, correcto, error |
| `src/data/exercises.js` | Definición de todos los ejercicios |

## Roadmap

- [ ] Deploy en Vercel con CI/CD desde GitHub
- [ ] Pruebas internas con micrófono real
- [ ] Ajuste fino del algoritmo de matching según resultados
- [ ] Análisis de audio con IA para feedback personalizado (Fase 2)
