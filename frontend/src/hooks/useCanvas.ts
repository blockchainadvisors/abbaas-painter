import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { getCanvasCoordinates, drawMaskOverlay } from '../lib/canvasUtils';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    lineGroups,
    currentLine,
    brushSize,
    isDrawing,
    setIsDrawing,
    addPointToCurrentLine,
    commitCurrentLine,
    imageDimensions,
  } = useEditorStore();

  // Redraw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDimensions) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaskOverlay(ctx, lineGroups, currentLine, brushSize);
  }, [lineGroups, currentLine, brushSize, imageDimensions]);

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasCoordinates(event, canvas);
      setIsDrawing(true);
      addPointToCurrentLine(point);
    },
    [setIsDrawing, addPointToCurrentLine]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasCoordinates(event, canvas);
      addPointToCurrentLine(point);
    },
    [isDrawing, addPointToCurrentLine]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      commitCurrentLine();
      setIsDrawing(false);
    }
  }, [isDrawing, commitCurrentLine, setIsDrawing]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      commitCurrentLine();
      setIsDrawing(false);
    }
  }, [isDrawing, commitCurrentLine, setIsDrawing]);

  // Touch events for mobile support
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasCoordinates(event, canvas);
      setIsDrawing(true);
      addPointToCurrentLine(point);
    },
    [setIsDrawing, addPointToCurrentLine]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasCoordinates(event, canvas);
      addPointToCurrentLine(point);
    },
    [isDrawing, addPointToCurrentLine]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDrawing) {
      commitCurrentLine();
      setIsDrawing(false);
    }
  }, [isDrawing, commitCurrentLine, setIsDrawing]);

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return { canvasRef };
}
