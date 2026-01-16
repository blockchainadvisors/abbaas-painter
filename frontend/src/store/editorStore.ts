import { create } from 'zustand';

export interface Point {
  x: number;
  y: number;
}

export interface LineGroup {
  points: Point[];
  brushSize: number;
}

interface EditorState {
  // Image state
  imageFile: File | null;
  imageElement: HTMLImageElement | null;
  imageDimensions: { width: number; height: number } | null;

  // Drawing state
  lineGroups: LineGroup[];
  brushSize: number;
  isDrawing: boolean;
  currentLine: Point[];

  // History
  redoStack: LineGroup[];

  // Processing state
  isProcessing: boolean;
  resultImage: string | null;
  error: string | null;

  // Actions
  setImageFile: (file: File | null) => void;
  setImageElement: (element: HTMLImageElement | null) => void;
  setImageDimensions: (dimensions: { width: number; height: number } | null) => void;
  setBrushSize: (size: number) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  addPointToCurrentLine: (point: Point) => void;
  commitCurrentLine: () => void;
  undo: () => void;
  redo: () => void;
  clearMask: () => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setResultImage: (result: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  imageFile: null,
  imageElement: null,
  imageDimensions: null,
  lineGroups: [],
  brushSize: 30,
  isDrawing: false,
  currentLine: [],
  redoStack: [],
  isProcessing: false,
  resultImage: null,
  error: null,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setImageFile: (file) => set({ imageFile: file }),

  setImageElement: (element) => set({ imageElement: element }),

  setImageDimensions: (dimensions) => set({ imageDimensions: dimensions }),

  setBrushSize: (size) => set({ brushSize: size }),

  setIsDrawing: (isDrawing) => set({ isDrawing }),

  addPointToCurrentLine: (point) =>
    set((state) => ({
      currentLine: [...state.currentLine, point],
    })),

  commitCurrentLine: () =>
    set((state) => {
      if (state.currentLine.length === 0) return state;
      return {
        lineGroups: [
          ...state.lineGroups,
          { points: state.currentLine, brushSize: state.brushSize },
        ],
        currentLine: [],
        redoStack: [], // Clear redo stack when new stroke is made
      };
    }),

  undo: () =>
    set((state) => {
      if (state.lineGroups.length === 0) return state;
      const lastLine = state.lineGroups[state.lineGroups.length - 1];
      return {
        lineGroups: state.lineGroups.slice(0, -1),
        redoStack: [...state.redoStack, lastLine],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return state;
      const lineToRedo = state.redoStack[state.redoStack.length - 1];
      return {
        lineGroups: [...state.lineGroups, lineToRedo],
        redoStack: state.redoStack.slice(0, -1),
      };
    }),

  clearMask: () =>
    set({
      lineGroups: [],
      currentLine: [],
      redoStack: [],
    }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setResultImage: (result) => set({ resultImage: result }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
