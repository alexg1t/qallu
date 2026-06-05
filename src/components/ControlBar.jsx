export default function ControlBar({ status, isListening, audioDetected, error, onStart, onPause, onResume, onStop, isSupported }) {
  if (!isSupported) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-amber-800 text-sm">
        Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge para la mejor experiencia.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && error.code !== 'network-retrying' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm max-w-md text-center">
          {error.message}
        </div>
      )}

      {error && error.code === 'network-retrying' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm max-w-md text-center">
          {error.message}
        </div>
      )}

      <div className="flex items-center gap-4">
        {status === 'idle' && (
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            <MicIcon />
            Comenzar
          </button>
        )}

        {status === 'active' && (
          <>
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              {audioDetected ? 'Escuchando...' : 'Esperando voz...'}
            </div>
            <button
              onClick={onPause}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded-lg transition-colors text-sm"
            >
              Pausar
            </button>
            <button
              onClick={onStop}
              className="text-gray-400 hover:text-gray-600 font-medium px-3 py-2 rounded-lg transition-colors text-sm"
            >
              Salir
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              onClick={onResume}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <MicIcon />
              Continuar
            </button>
            <button
              onClick={onStop}
              className="text-gray-400 hover:text-gray-600 font-medium px-3 py-2 rounded-lg transition-colors text-sm"
            >
              Salir
            </button>
          </>
        )}

        {status === 'countdown' && (
          <button
            onClick={onStop}
            className="text-gray-400 hover:text-gray-600 font-medium px-3 py-2 rounded-lg transition-colors text-sm"
          >
            Cancelar
          </button>
        )}

        {status === 'requesting-permission' && (
          <div className="text-gray-500 text-sm">Solicitando permiso...</div>
        )}

        {status === 'error' && (
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
    </svg>
  )
}
