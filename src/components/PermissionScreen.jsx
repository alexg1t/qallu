export default function PermissionScreen({ status, onRequest }) {
  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto text-center">
        <div className="text-5xl">🎙️</div>
        <h2 className="text-2xl font-bold text-gray-800">Micrófono bloqueado</h2>
        <p className="text-gray-600">
          Qallu necesita acceso al micrófono para los ejercicios. Lo bloqueaste anteriormente.
        </p>
        <ol className="text-left text-sm text-gray-600 space-y-2 bg-gray-50 rounded-lg p-4 w-full">
          <li>1. Haz clic en el candado 🔒 en la barra de direcciones del navegador.</li>
          <li>2. Busca "Micrófono" y cámbialo a "Permitir".</li>
          <li>3. Recarga la página.</li>
        </ol>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto text-center">
      <div className="text-5xl">🎙️</div>
      <h2 className="text-2xl font-bold text-gray-800">Acceso al micrófono</h2>
      <p className="text-gray-600">
        Qallu necesita escuchar tu voz para darte feedback en tiempo real. Tu audio nunca se graba ni se envía a ningún servidor.
      </p>
      <button
        onClick={onRequest}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
      >
        Permitir micrófono
      </button>
    </div>
  )
}
