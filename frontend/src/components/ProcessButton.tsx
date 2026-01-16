import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { inpaintImage } from '../lib/api';
import { fileToBase64, generateMask, canvasToBase64 } from '../lib/canvasUtils';

export function ProcessButton() {
  const {
    imageFile,
    imageDimensions,
    lineGroups,
    currentLine,
    brushSize,
    isProcessing,
    setIsProcessing,
    setResultImage,
    setError,
  } = useEditorStore();

  const handleProcess = useCallback(async () => {
    if (!imageFile || !imageDimensions || lineGroups.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Convert image to base64
      const imageBase64 = await fileToBase64(imageFile);

      // Generate mask from brush strokes
      const maskCanvas = generateMask(
        imageDimensions.width,
        imageDimensions.height,
        lineGroups,
        currentLine,
        brushSize
      );
      const maskBase64 = canvasToBase64(maskCanvas);

      // Send to backend
      const result = await inpaintImage(imageBase64, maskBase64);
      setResultImage(result);
    } catch (error) {
      console.error('Inpainting failed:', error);
      setError(error instanceof Error ? error.message : 'Inpainting failed');
    } finally {
      setIsProcessing(false);
    }
  }, [
    imageFile,
    imageDimensions,
    lineGroups,
    currentLine,
    brushSize,
    setIsProcessing,
    setResultImage,
    setError,
  ]);

  const canProcess = imageFile && imageDimensions && lineGroups.length > 0 && !isProcessing;

  return (
    <button
      onClick={handleProcess}
      disabled={!canProcess}
      className={`
        px-6 py-3 text-lg font-semibold rounded-lg
        transition-all duration-200
        ${canProcess
          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
      `}
    >
      {isProcessing ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        'Remove Objects'
      )}
    </button>
  );
}
