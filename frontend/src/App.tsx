import { useEffect } from 'react';
import { useEditorStore } from './store/editorStore';
import { ImageUpload } from './components/ImageUpload';
import { Canvas } from './components/Canvas';
import { MaskCanvas } from './components/MaskCanvas';
import { BrushControls } from './components/BrushControls';
import { ProcessButton } from './components/ProcessButton';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ResultDisplay } from './components/ResultDisplay';

function App() {
  const { imageElement, imageDimensions, error, setError, undo, redo, reset } = useEditorStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Calculate canvas container dimensions
  const maxWidth = 800;
  const maxHeight = 600;
  let displayWidth = maxWidth;
  let displayHeight = maxHeight;

  if (imageDimensions) {
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    if (aspectRatio > maxWidth / maxHeight) {
      displayWidth = maxWidth;
      displayHeight = maxWidth / aspectRatio;
    } else {
      displayHeight = maxHeight;
      displayWidth = maxHeight * aspectRatio;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Abbaas Painter</h1>
          <p className="text-gray-600">
            Upload an image, brush over objects to remove, and let AI do the magic
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-6">
          {!imageElement ? (
            <ImageUpload />
          ) : (
            <>
              {/* Canvas Container */}
              <div
                className="relative bg-gray-200 rounded-lg overflow-hidden shadow-lg"
                style={{ width: displayWidth, height: displayHeight }}
              >
                <Canvas />
                <MaskCanvas />
              </div>

              {/* Controls */}
              <BrushControls />

              {/* Error Display */}
              {error && (
                <div className="w-full max-w-2xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center">
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-700 hover:text-red-900"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <ProcessButton />
                <button
                  onClick={reset}
                  className="px-6 py-3 text-lg font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                >
                  Upload New Image
                </button>
              </div>

              {/* Instructions */}
              <div className="text-center text-gray-500 text-sm">
                <p>Brush over objects you want to remove</p>
                <p className="mt-1">
                  Keyboard shortcuts: <kbd className="px-1 bg-gray-200 rounded">Ctrl+Z</kbd> Undo,{' '}
                  <kbd className="px-1 bg-gray-200 rounded">Ctrl+Y</kbd> Redo
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlays */}
      <LoadingOverlay />
      <ResultDisplay />
    </div>
  );
}

export default App;
