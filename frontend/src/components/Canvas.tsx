import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { imageElement, imageDimensions } = useEditorStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement || !imageDimensions) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;

    // Draw the image
    ctx.drawImage(imageElement, 0, 0);
  }, [imageElement, imageDimensions]);

  if (!imageDimensions) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
