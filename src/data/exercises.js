import { countTokenSyllables } from './syllableUtils.js'

function makeTokens(text) {
  return text.replace(/[.,;:¡!¿?]/g, '').split(/\s+/).filter(Boolean)
}

// ─── MINIMAL PAIRS ────────────────────────────────────────────────────────────

const minimalPairsExercises = [
  {
    id: 'mp-001',
    type: 'minimal-pairs',
    title: 'La vaca bebe agua',
    description: 'Practica el contraste /b/–/v/ en contexto natural. Ambos sonidos se articulan de forma similar en español, pero la distinción ortográfica ayuda a la precisión.',
    difficulty: 'beginner',
    estimatedMinutes: 3,
    content: {
      contrast: 'b–v',
      sentences: [
        {
          id: 's1',
          text: 'La vaca bebe agua del vado',
          tokens: makeTokens('La vaca bebe agua del vado'),
          targetIndices: [1, 2, 5],
        },
        {
          id: 's2',
          text: 'El barco viaja por la bahía verde',
          tokens: makeTokens('El barco viaja por la bahía verde'),
          targetIndices: [1, 2, 5, 6],
        },
        {
          id: 's3',
          text: 'Vine a ver la viña del abuelo',
          tokens: makeTokens('Vine a ver la viña del abuelo'),
          targetIndices: [0, 2, 4],
        },
        {
          id: 's4',
          text: 'El vestido blanco brilla bajo el sol',
          tokens: makeTokens('El vestido blanco brilla bajo el sol'),
          targetIndices: [1, 2, 3, 4],
        },
      ],
    },
  },
  {
    id: 'mp-002',
    type: 'minimal-pairs',
    title: 'Caro y carro',
    description: 'Practica el contraste /ɾ/–/r/ (vibrante simple vs. múltiple). Un error en estos sonidos puede cambiar el significado de la palabra.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    content: {
      contrast: 'ɾ–r',
      sentences: [
        {
          id: 's1',
          text: 'El perro de Pedro corre por el prado',
          tokens: makeTokens('El perro de Pedro corre por el prado'),
          targetIndices: [1, 2, 3, 4],
        },
        {
          id: 's2',
          text: 'El carro caro recorre la carretera',
          tokens: makeTokens('El carro caro recorre la carretera'),
          targetIndices: [1, 2, 3, 5],
        },
        {
          id: 's3',
          text: 'Quiero un ratón para el laboratorio',
          tokens: makeTokens('Quiero un ratón para el laboratorio'),
          targetIndices: [0, 2, 5],
        },
        {
          id: 's4',
          text: 'La tierra roja del río tiene hierro',
          tokens: makeTokens('La tierra roja del río tiene hierro'),
          targetIndices: [1, 2, 4, 6],
        },
      ],
    },
  },
  {
    id: 'mp-003',
    type: 'minimal-pairs',
    title: 'La d de "helado"',
    description: 'La /d/ entre vocales tiende a relajarse o desaparecer en el habla informal ("helao", "nada"→"na"). Entrena su articulación clara para contextos formales.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    content: {
      contrast: 'd intervocálica',
      sentences: [
        {
          id: 's1',
          text: 'El helado de limón quedó olvidado sobre la mesa',
          tokens: makeTokens('El helado de limón quedó olvidado sobre la mesa'),
          targetIndices: [1, 5],
        },
        {
          id: 's2',
          text: 'El soldado educado cruzó el vado del río',
          tokens: makeTokens('El soldado educado cruzó el vado del río'),
          targetIndices: [1, 2, 5],
        },
        {
          id: 's3',
          text: 'Me han dado un recado de la ciudad pasada',
          tokens: makeTokens('Me han dado un recado de la ciudad pasada'),
          targetIndices: [2, 4, 7, 8],
        },
        {
          id: 's4',
          text: 'Los graduados han llegado al lado opuesto del mercado',
          tokens: makeTokens('Los graduados han llegado al lado opuesto del mercado'),
          targetIndices: [1, 3, 5, 9],
        },
      ],
    },
  },
  {
    id: 'mp-004',
    type: 'minimal-pairs',
    title: 'Virtud, cristal, ciudad',
    description: 'Las consonantes en posición final (-d, -z, -l, -r) se relajan en el habla rápida. Practica su articulación precisa sin exagerar: deben sonar, no desaparecer.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    content: {
      contrast: 'consonantes en posición final',
      sentences: [
        {
          id: 's1',
          text: 'La ciudad recibió luz del sol al final del día',
          tokens: makeTokens('La ciudad recibió luz del sol al final del día'),
          targetIndices: [1, 3, 5, 7],
        },
        {
          id: 's2',
          text: 'El árbol del jardín da calor y paz al hogar',
          tokens: makeTokens('El árbol del jardín da calor y paz al hogar'),
          targetIndices: [1, 3, 5, 7, 9],
        },
        {
          id: 's3',
          text: 'Hay que aprender a hablar con verdad y claridad',
          tokens: makeTokens('Hay que aprender a hablar con verdad y claridad'),
          targetIndices: [2, 4, 6, 8],
        },
        {
          id: 's4',
          text: 'El portal de cristal al final del pasillo da al jardín',
          tokens: makeTokens('El portal de cristal al final del pasillo da al jardín'),
          targetIndices: [1, 3, 5, 10],
        },
      ],
    },
  },
  {
    id: 'mp-005',
    type: 'minimal-pairs',
    title: 'Transparente y abstracto',
    description: 'Grupos consonánticos complejos que el habla rápida simplifica: /nstr/, /bstr/, /xact/, /nsp/. La dicción formal exige articularlos íntegramente.',
    difficulty: 'advanced',
    estimatedMinutes: 4,
    content: {
      contrast: 'grupos consonánticos',
      sentences: [
        {
          id: 's1',
          text: 'El inspector describió la transacción con exactitud',
          tokens: makeTokens('El inspector describió la transacción con exactitud'),
          targetIndices: [1, 2, 3, 5],
        },
        {
          id: 's2',
          text: 'La construcción abstracta requiere gran precisión',
          tokens: makeTokens('La construcción abstracta requiere gran precisión'),
          targetIndices: [1, 2, 5],
        },
        {
          id: 's3',
          text: 'La circunstancia obstaculizó el progreso del proyecto',
          tokens: makeTokens('La circunstancia obstaculizó el progreso del proyecto'),
          targetIndices: [1, 2, 4, 6],
        },
        {
          id: 's4',
          text: 'El transportista transcribió los datos con perspectiva',
          tokens: makeTokens('El transportista transcribió los datos con perspectiva'),
          targetIndices: [1, 2, 6],
        },
      ],
    },
  },
]

// ─── VISUAL PACER ─────────────────────────────────────────────────────────────

function makePacerExercise({ id, title, description, difficulty, text, targetSyllablesPerSecond }) {
  const tokens = makeTokens(text)
  const syllableCounts = countTokenSyllables(tokens)
  return {
    id,
    type: 'visual-pacer',
    title,
    description,
    difficulty,
    estimatedMinutes: 3,
    content: { text, tokens, syllableCounts, targetSyllablesPerSecond },
  }
}

const pacerExercises = [
  makePacerExercise({
    id: 'vp-001',
    title: 'Ritmo pausado — noticias',
    description: 'Lee este fragmento de noticiero al ritmo del pacer. El objetivo es mantener una cadencia estable, sin acelerar en las palabras fáciles ni ralentizar en las difíciles.',
    difficulty: 'beginner',
    text: 'El gobierno anunció hoy nuevas medidas para reducir el costo de los alimentos básicos en todo el país',
    targetSyllablesPerSecond: 3.5,
  }),
  makePacerExercise({
    id: 'vp-002',
    title: 'Ritmo natural — conversación',
    description: 'Practica el ritmo del habla conversacional formal. Este fragmento tiene una densidad silábica intermedia que representa el habla profesional clara.',
    difficulty: 'intermediate',
    text: 'Buenos días a todos los presentes hoy vamos a revisar los resultados del trimestre anterior',
    targetSyllablesPerSecond: 4.5,
  }),
  makePacerExercise({
    id: 'vp-003',
    title: 'Ritmo rápido — exposición',
    description: 'Velocidad de exposición académica. Mantener claridad articulatoria a este ritmo es el desafío principal.',
    difficulty: 'advanced',
    text: 'La comunicación efectiva requiere no solo claridad en el mensaje sino también conciencia del receptor y del contexto situacional',
    targetSyllablesPerSecond: 5.5,
  }),
  makePacerExercise({
    id: 'vp-004',
    title: 'El Quijote — Cervantes',
    description: 'La prosa de Cervantes tiene cláusulas largas y un ritmo marcado. Sigue el pacer sin perder la musicalidad: cada grupo fónico debe llegar entero.',
    difficulty: 'beginner',
    text: 'En un lugar de la Mancha de cuyo nombre no quiero acordarme no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero adarga antigua rocín flaco y galgo corredor',
    targetSyllablesPerSecond: 3.8,
  }),
  makePacerExercise({
    id: 'vp-005',
    title: 'Divulgación — comunicación no verbal',
    description: 'Texto de divulgación a ritmo intermedio-alto. El léxico específico y las frases largas exigen mantener articulación clara sin perder la velocidad.',
    difficulty: 'intermediate',
    text: 'La comunicación no verbal representa más del sesenta por ciento del mensaje total en una conversación presencial y tiene un impacto directo en cómo perciben los demás nuestra credibilidad y nivel de autoridad',
    targetSyllablesPerSecond: 4.8,
  }),
  makePacerExercise({
    id: 'vp-006',
    title: 'Discurso formal — libertad y democracia',
    description: 'Velocidad de conferencia o discurso político. El pacer no perdona las sílabas tónicas débiles: cada palabra debe llegar con igual peso articulatorio.',
    difficulty: 'advanced',
    text: 'La libertad de expresión es el fundamento de toda sociedad democrática y su defensa exige no solo valentía individual sino también instituciones sólidas que protejan el derecho a disentir',
    targetSyllablesPerSecond: 5.2,
  }),
]

// ─── EMPHASIS FOCUS ───────────────────────────────────────────────────────────

const emphasisExercises = [
  {
    id: 'ef-001',
    type: 'emphasis-focus',
    title: '¿Quién compró los zapatos?',
    description: 'La misma oración cambia de significado según qué palabra enfatices. Sigue el foco indicado en cada ronda.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    content: {
      text: 'María compró los zapatos ayer',
      tokens: makeTokens('María compró los zapatos ayer'),
      rounds: [
        { emphasizedIndex: 0, meaning: '¿Quién compró? — MARÍA (no Juan, no Pedro)' },
        { emphasizedIndex: 1, meaning: '¿Qué hizo? — COMPRÓ (no probó, no devolvió)' },
        { emphasizedIndex: 3, meaning: '¿Qué compró? — los ZAPATOS (no la ropa)' },
        { emphasizedIndex: 4, meaning: '¿Cuándo? — AYER (no hoy, no la semana pasada)' },
      ],
    },
  },
  {
    id: 'ef-002',
    type: 'emphasis-focus',
    title: 'El director aprobó el proyecto',
    description: 'Practica el énfasis prosódico en un contexto profesional. Cada ronda destaca información nueva.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    content: {
      text: 'El director aprobó el proyecto completo',
      tokens: makeTokens('El director aprobó el proyecto completo'),
      rounds: [
        { emphasizedIndex: 1, meaning: '¿Quién aprobó? — el DIRECTOR (no el comité)' },
        { emphasizedIndex: 2, meaning: '¿Qué hizo? — APROBÓ (no rechazó)' },
        { emphasizedIndex: 4, meaning: '¿Qué aprobó? — el PROYECTO (no el presupuesto)' },
        { emphasizedIndex: 5, meaning: '¿Cómo lo aprobó? — COMPLETO (no solo una parte)' },
      ],
    },
  },
]

// ─── TONGUE TWISTERS ──────────────────────────────────────────────────────────

const tonguetwisterExercises = [
  {
    id: 'tt-001',
    type: 'tongue-twister',
    title: 'Pablito clavó un clavito',
    description: 'Practica grupos consonánticos /kl/ y oclusivas encadenadas. Progresa de la frase corta al trabalenguas completo.',
    difficulty: 'beginner',
    estimatedMinutes: 2,
    content: {
      focus: '/kl/ y oclusivas',
      sentences: [
        { id: 's1', text: 'Pablito clavó un clavito', tokens: makeTokens('Pablito clavó un clavito') },
        { id: 's2', text: 'qué clavito clavó Pablito', tokens: makeTokens('qué clavito clavó Pablito') },
        { id: 's3', text: 'Pablito clavó un clavito qué clavito clavó Pablito', tokens: makeTokens('Pablito clavó un clavito qué clavito clavó Pablito') },
      ],
    },
  },
  {
    id: 'tt-002',
    type: 'tongue-twister',
    title: 'Tres tristes tigres',
    description: 'Clásico de la /r/ múltiple y el grupo /tr/. Construye el ritmo palabra a palabra hasta decirlo de un tirón.',
    difficulty: 'beginner',
    estimatedMinutes: 2,
    content: {
      focus: '/tr/ y vibrante múltiple',
      sentences: [
        { id: 's1', text: 'Tres tristes tigres', tokens: makeTokens('Tres tristes tigres') },
        { id: 's2', text: 'Tres tristes tigres comen trigo', tokens: makeTokens('Tres tristes tigres comen trigo') },
        { id: 's3', text: 'Tres tristes tigres comen trigo en un trigal', tokens: makeTokens('Tres tristes tigres comen trigo en un trigal') },
      ],
    },
  },
  {
    id: 'tt-003',
    type: 'tongue-twister',
    title: 'Como poco coco compro',
    description: 'Alternancia densa de /k/ y /p/. La velocidad es el desafío: mantén la claridad articulatoria en la ráfaga de oclusivas.',
    difficulty: 'intermediate',
    estimatedMinutes: 2,
    content: {
      focus: 'oclusivas /k/ y /p/ en serie',
      sentences: [
        { id: 's1', text: 'como poco coco como', tokens: makeTokens('como poco coco como') },
        { id: 's2', text: 'poco coco compro', tokens: makeTokens('poco coco compro') },
        { id: 's3', text: 'como poco coco como poco coco compro', tokens: makeTokens('como poco coco como poco coco compro') },
      ],
    },
  },
  {
    id: 'tt-005',
    type: 'tongue-twister',
    title: 'Sansón sazona su salsa',
    description: 'Densidad máxima de /s/ en posición inicial y final de sílaba. Uno de los trabalenguas más efectivos para trabajar la sibilante.',
    difficulty: 'intermediate',
    estimatedMinutes: 2,
    content: {
      focus: '/s/ en toda posición silábica',
      sentences: [
        { id: 's1', text: 'Si Sansón no sazona su salsa con sal le sale sosa', tokens: makeTokens('Si Sansón no sazona su salsa con sal le sale sosa') },
        { id: 's2', text: 'le sale sosa su salsa a Sansón si la sazona sin sal', tokens: makeTokens('le sale sosa su salsa a Sansón si la sazona sin sal') },
        { id: 's3', text: 'Si Sansón no sazona su salsa con sal le sale sosa su salsa a Sansón si la sazona sin sal', tokens: makeTokens('Si Sansón no sazona su salsa con sal le sale sosa su salsa a Sansón si la sazona sin sal') },
      ],
    },
  },
  {
    id: 'tt-004',
    type: 'tongue-twister',
    title: 'Me han dicho que has dicho',
    description: 'Repetición intensa de /tʃ/ y /d/ en cadena. Requiere memoria articulatoria además de velocidad: el trabalenguas más exigente.',
    difficulty: 'advanced',
    estimatedMinutes: 3,
    content: {
      focus: '/tʃ/ y /d/ en densidad alta',
      sentences: [
        { id: 's1', text: 'me han dicho que has dicho un dicho que yo he dicho', tokens: makeTokens('me han dicho que has dicho un dicho que yo he dicho') },
        { id: 's2', text: 'ese dicho que te han dicho que yo he dicho no lo he dicho', tokens: makeTokens('ese dicho que te han dicho que yo he dicho no lo he dicho') },
        { id: 's3', text: 'y si yo lo hubiera dicho estaría bien dicho por haberlo dicho yo', tokens: makeTokens('y si yo lo hubiera dicho estaría bien dicho por haberlo dicho yo') },
      ],
    },
  },
]

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export const exercises = [
  ...minimalPairsExercises,
  ...pacerExercises,
  ...emphasisExercises,
  ...tonguetwisterExercises,
]

export function getExercise(id) {
  return exercises.find(e => e.id === id)
}

export const TYPE_LABELS = {
  'minimal-pairs': 'Pares Mínimos',
  'visual-pacer': 'Pacer Visual',
  'emphasis-focus': 'Énfasis y Foco',
  'tongue-twister': 'Trabalenguas',
}

export const DIFFICULTY_LABELS = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}
