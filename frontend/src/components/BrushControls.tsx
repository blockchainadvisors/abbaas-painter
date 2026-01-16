import { useEditorStore } from '../store/editorStore';

export function BrushControls() {
  const { brushSize, setBrushSize, undo, redo, clearMask, lineGroups, redoStack } =
    useEditorStore();

  const canUndo = lineGroups.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow">
      {/* Brush Size Slider */}
      <div className="flex items-center gap-2">
        <label htmlFor="brush-size" className="text-sm font-medium text-gray-700">
          Brush Size
        </label>
        <input
          id="brush-size"
          type="range"
          min="5"
          max="100"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-sm text-gray-600 w-8">{brushSize}px</span>
      </div>

      {/* Undo/Redo/Clear Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`
            px-3 py-1.5 text-sm font-medium rounded
            ${canUndo
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
          `}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`
            px-3 py-1.5 text-sm font-medium rounded
            ${canRedo
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
          `}
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
        <button
          onClick={clearMask}
          disabled={!canUndo}
          className={`
            px-3 py-1.5 text-sm font-medium rounded
            ${canUndo
              ? 'bg-red-100 hover:bg-red-200 text-red-700'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
          `}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
