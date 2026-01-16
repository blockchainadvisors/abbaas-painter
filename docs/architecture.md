# Architecture Overview

This document provides a comprehensive overview of the Abbaas Painter system architecture, including component design, data flow, and key implementation decisions.

---

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Model Integration](#model-integration)
- [State Management](#state-management)
- [Security Considerations](#security-considerations)

---

## System Overview

Abbaas Painter follows a **client-server architecture** with clear separation of concerns:

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Presentation | React + TypeScript | User interface, interaction handling |
| State | Zustand | Application state management |
| API Client | Fetch API | HTTP communication |
| API Server | FastAPI | Request handling, validation |
| Service | Python | Business logic, model inference |
| Model | LaMa (PyTorch) | AI-powered inpainting |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     React Application                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │   Canvas    │  │    Mask     │  │    Controls         │   │  │
│  │  │  Component  │  │   Canvas    │  │  (Brush, Undo, etc) │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │
│  │                          │                                     │  │
│  │                    ┌─────▼─────┐                              │  │
│  │                    │  Zustand  │                              │  │
│  │                    │   Store   │                              │  │
│  │                    └─────┬─────┘                              │  │
│  │                          │                                     │  │
│  │                    ┌─────▼─────┐                              │  │
│  │                    │    API    │                              │  │
│  │                    │  Client   │                              │  │
│  │                    └─────┬─────┘                              │  │
│  └──────────────────────────┼────────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTPS/HTTP
                              │ JSON (Base64 Images)
┌─────────────────────────────┼───────────────────────────────────────┐
│                             │          SERVER                        │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │                      FastAPI Application                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │    CORS     │  │  Validation │  │      Routing        │   │  │
│  │  │ Middleware  │  │  (Pydantic) │  │   /api/v1/inpaint   │   │  │
│  │  └─────────────┘  └─────────────┘  └──────────┬──────────┘   │  │
│  │                                               │               │  │
│  │                                    ┌──────────▼──────────┐   │  │
│  │                                    │   Inpaint Service   │   │  │
│  │                                    │  ┌───────────────┐  │   │  │
│  │                                    │  │  LaMa Model   │  │   │  │
│  │                                    │  │  (PyTorch)    │  │   │  │
│  │                                    │  └───────────────┘  │   │  │
│  │                                    └─────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── ImageUpload          # Shown when no image loaded
│
├── Canvas Container     # Shown when image loaded
│   ├── Canvas           # Background image layer (non-interactive)
│   └── MaskCanvas       # Drawing layer (interactive)
│
├── BrushControls        # Brush size, undo/redo, clear
├── ProcessButton        # Triggers inpainting
├── LoadingOverlay       # Processing indicator (modal)
└── ResultDisplay        # Result preview (modal)
```

### Dual Canvas Architecture

The editor uses a **two-layer canvas system** for optimal performance and separation:

```
┌────────────────────────────────────────┐
│          MaskCanvas (Top Layer)        │  ← User draws here
│  - Transparent background              │  ← Captures mouse/touch
│  - Semi-transparent red strokes        │  ← Visual feedback
│  - Cursor preview circle               │
├────────────────────────────────────────┤
│          Canvas (Bottom Layer)         │  ← Display only
│  - Original uploaded image             │  ← pointer-events: none
│  - Static, no interaction              │
└────────────────────────────────────────┘
```

**Benefits:**
- Image remains crisp (no redraw on each stroke)
- Mask strokes can be cleared without affecting image
- Separate coordinate systems if needed
- Better performance for large images

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `ImageUpload` | File selection via drag-drop or click, image validation |
| `Canvas` | Renders uploaded image at correct dimensions |
| `MaskCanvas` | Handles drawing input, renders stroke overlay, cursor preview |
| `BrushControls` | Brush size slider, undo/redo/clear buttons |
| `ProcessButton` | Generates mask, triggers API call, handles loading state |
| `ResultDisplay` | Modal with result image, download and edit-again actions |
| `LoadingOverlay` | Full-screen processing indicator |

---

## Backend Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  app/main.py          - FastAPI app, CORS, router mounting  │
│  app/api/routes.py    - Endpoint definitions, validation    │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                           │
│  app/services/inpaint_service.py                            │
│    - LaMaInpainter class (singleton)                        │
│    - Model loading (lazy, cached)                           │
│    - Image preprocessing                                     │
│    - Inference execution                                     │
│    - Result compositing                                      │
├─────────────────────────────────────────────────────────────┤
│                      Utility Layer                           │
│  app/utils/image_utils.py                                   │
│    - Base64 encoding/decoding                               │
│    - PIL <-> NumPy conversion                               │
│    - Image format handling                                   │
└─────────────────────────────────────────────────────────────┘
```

### Service Pattern

The `LaMaInpainter` class implements the **Singleton pattern** to ensure:

1. Model is loaded only once (expensive operation)
2. Memory is efficiently managed
3. Concurrent requests share the same model instance

```python
class LaMaInpainter:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
```

---

## Data Flow

### Inpainting Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │ Backend  │     │  LaMa    │
│  Action  │     │          │     │          │     │  Model   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Draw strokes   │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │ Click Process  │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ Generate mask  │                │
     │                │ from strokes   │                │
     │                │────────┐       │                │
     │                │        │       │                │
     │                │<───────┘       │                │
     │                │                │                │
     │                │ POST /inpaint  │                │
     │                │ {image, mask}  │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ Preprocess     │
     │                │                │────────┐       │
     │                │                │        │       │
     │                │                │<───────┘       │
     │                │                │                │
     │                │                │ Inference      │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │    Result      │
     │                │                │<───────────────│
     │                │                │                │
     │                │                │ Composite      │
     │                │                │────────┐       │
     │                │                │        │       │
     │                │                │<───────┘       │
     │                │                │                │
     │                │ {result}       │                │
     │                │<───────────────│                │
     │                │                │                │
     │ Display result │                │                │
     │<───────────────│                │                │
     │                │                │                │
```

### Image Processing Pipeline

```
Input Image          Input Mask           Processing Steps
───────────          ──────────           ────────────────
┌──────────┐        ┌──────────┐
│  RGB     │        │ Grayscale│         1. Binarize mask (threshold 127)
│  uint8   │        │  uint8   │         2. Dilate mask (2 iterations)
│  H×W×3   │        │  H×W     │         3. Pad to multiple of 8
└────┬─────┘        └────┬─────┘         4. Normalize to [0,1]
     │                   │               5. Zero masked regions in image
     │                   │               6. Run LaMa inference
     ▼                   ▼               7. Composite result with original
┌─────────────────────────────────┐
│        LaMa Model               │
│   Input: (1,3,H,W) + (1,1,H,W)  │
│   Output: (1,3,H,W)             │
└──────────────┬──────────────────┘
               │
               ▼
        ┌──────────┐
        │  Result  │      8. Crop to original size
        │  RGB     │      9. Encode to Base64
        │  uint8   │
        └──────────┘
```

---

## Model Integration

### LaMa Model Overview

**LaMa (Large Mask Inpainting)** is a deep learning model designed for high-quality image inpainting:

| Aspect | Details |
|--------|---------|
| Architecture | Fourier convolutions for global context |
| Input | RGB image + binary mask |
| Output | Inpainted RGB image |
| Resolution | Any (padded to multiples of 8) |
| Format | TorchScript (.pt) |
| Size | ~200MB |

### Model Loading Strategy

```python
def _load_model(self):
    """Lazy loading - model downloaded and loaded on first use"""
    if self.model is not None:
        return  # Already loaded

    # Download from HuggingFace Hub (cached after first download)
    model_path = hf_hub_download(
        repo_id="fashn-ai/LaMa",
        filename="big-lama.pt"
    )

    # Load TorchScript model
    self.model = torch.jit.load(model_path, map_location=self.device)
    self.model.eval()
```

### Preprocessing Steps

1. **Mask Binarization**: Threshold at 127 to create clean binary mask
2. **Mask Dilation**: Expand mask by 2 pixels for better edge blending
3. **Padding**: Ensure dimensions are multiples of 8 (model requirement)
4. **Normalization**: Scale pixel values to [0, 1]
5. **Masking**: Zero out image regions marked for inpainting

### Postprocessing Steps

1. **Crop**: Remove padding to restore original dimensions
2. **Composite**: Blend model output with original using mask
3. **Encoding**: Convert to Base64 for transmission

---

## State Management

### Zustand Store Structure

```typescript
interface EditorState {
  // Image State
  imageFile: File | null;
  imageElement: HTMLImageElement | null;
  imageDimensions: { width: number; height: number } | null;

  // Drawing State
  lineGroups: LineGroup[];      // Committed strokes
  currentLine: Point[];         // Stroke in progress
  brushSize: number;            // Current brush size (5-100)
  isDrawing: boolean;           // Mouse/touch down state

  // History
  redoStack: LineGroup[];       // Undone strokes for redo

  // Processing State
  isProcessing: boolean;        // API call in progress
  resultImage: string | null;   // Base64 result
  error: string | null;         // Error message

  // Actions
  setImageFile: (file: File | null) => void;
  setBrushSize: (size: number) => void;
  addPointToCurrentLine: (point: Point) => void;
  commitCurrentLine: () => void;
  undo: () => void;
  redo: () => void;
  clearMask: () => void;
  reset: () => void;
  // ... more actions
}
```

### Undo/Redo Implementation

```
User draws stroke A    lineGroups: [A]      redoStack: []
User draws stroke B    lineGroups: [A,B]    redoStack: []
User draws stroke C    lineGroups: [A,B,C]  redoStack: []
User clicks Undo       lineGroups: [A,B]    redoStack: [C]
User clicks Undo       lineGroups: [A]      redoStack: [C,B]
User clicks Redo       lineGroups: [A,B]    redoStack: [C]
User draws stroke D    lineGroups: [A,B,D]  redoStack: []  ← Redo stack cleared
```

---

## Security Considerations

### Input Validation

| Layer | Validation |
|-------|------------|
| Frontend | File type checking (image/*) |
| Backend | Base64 format validation |
| Backend | Image format validation (PIL) |
| Backend | Pydantic request validation |

### CORS Policy

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Data Handling

- Images are processed in memory (not stored on disk)
- No authentication required (stateless API)
- No user data persistence
- Base64 encoding for safe transmission

---

## Performance Considerations

| Factor | Approach |
|--------|----------|
| Model Loading | Lazy loading, singleton pattern |
| Image Size | Client-side display scaling, full resolution processing |
| Memory | Images processed in memory, garbage collected after response |
| Concurrency | FastAPI async, but model inference is synchronous |
| Caching | HuggingFace Hub caches downloaded model |

---

## Future Considerations

- **GPU Support**: Add CUDA device selection for faster inference
- **Batch Processing**: Support multiple images in single request
- **Model Selection**: Allow choosing between different inpainting models
- **Progressive Loading**: Stream results for large images
- **WebSocket**: Real-time progress updates during processing
