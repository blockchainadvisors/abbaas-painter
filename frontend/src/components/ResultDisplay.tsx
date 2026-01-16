import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

export function ResultDisplay() {
  const { resultImage, setResultImage, clearMask } = useEditorStore();

  const handleDownload = useCallback(() => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `inpainted-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resultImage]);

  const handleEditAgain = useCallback(() => {
    setResultImage(null);
    clearMask();
  }, [setResultImage, clearMask]);

  if (!resultImage) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Result</h2>
          <button
            onClick={() => setResultImage(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
          <img
            src={resultImage}
            alt="Inpainted result"
            className="max-w-full max-h-full object-contain shadow-lg"
          />
        </div>

        <div className="p-4 border-t flex justify-center gap-4">
          <button
            onClick={handleDownload}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition-colors"
          >
            Download
          </button>
          <button
            onClick={handleEditAgain}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors"
          >
            Edit Again
          </button>
        </div>
      </div>
    </div>
  );
}
