import { useEffect, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useCanvas } from '../hooks/useCanvas';

export function MaskCanvas() {
  const { canvasRef } = useCanvas();
  const { imageDimensions, brushSize } = useEditorStore();
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDimensions) return;

    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;
  }, [imageDimensions, canvasRef]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setCursorPosition(null);
  };

  if (!imageDimensions) return null;

  // Calculate scaled brush size for display
  const canvas = canvasRef.current;
  const scaleX = canvas ? canvas.getBoundingClientRect().width / imageDimensions.width : 1;
  const displayBrushSize = brushSize * scaleX;

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {cursorPosition && (
        <div
          className="pointer-events-none absolute border-2 border-white rounded-full"
          style={{
            width: displayBrushSize,
            height: displayBrushSize,
            left: cursorPosition.x - displayBrushSize / 2,
            top: cursorPosition.y - displayBrushSize / 2,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
          }}
        />
      )}
    </div>
  );
}
