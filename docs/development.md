# Development Guide

This guide covers setting up your development environment, coding standards, and contribution workflow for Abbaas Painter.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Contributing](#contributing)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.12+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| npm | 9+ | Package management |
| Git | 2.0+ | Version control |

### Recommended Tools

| Tool | Purpose |
|------|---------|
| VS Code | IDE with excellent TypeScript/Python support |
| Postman | API testing |
| React DevTools | Browser extension for React debugging |

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.vscode-pylance"
  ]
}
```

---

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/abbaas-painter.git
cd abbaas-painter
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```

The `--reload` flag enables hot reloading on code changes.

### 3. Frontend Setup

```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Verify Setup

| Service | URL | Expected |
|---------|-----|----------|
| Frontend | http://localhost:5173 | Application loads |
| Backend | http://localhost:8000 | JSON response |
| API Docs | http://localhost:8000/docs | Swagger UI |

---

## Project Structure

### Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   │                           # - App initialization
│   │                           # - CORS configuration
│   │                           # - Router mounting
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # API endpoint definitions
│   │                           # - Request/response models
│   │                           # - Route handlers
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── inpaint_service.py  # Business logic
│   │                           # - LaMa model management
│   │                           # - Image processing
│   │
│   └── utils/
│       ├── __init__.py
│       └── image_utils.py      # Utility functions
│                               # - Base64 encoding/decoding
│                               # - Image format conversion
│
├── requirements.txt            # Python dependencies
└── venv/                       # Virtual environment (gitignored)
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/             # React components
│   │   ├── Canvas.tsx          # Image display layer
│   │   ├── MaskCanvas.tsx      # Drawing interaction layer
│   │   ├── BrushControls.tsx   # Brush settings UI
│   │   ├── ImageUpload.tsx     # File upload UI
│   │   ├── ProcessButton.tsx   # Action button
│   │   ├── ResultDisplay.tsx   # Result modal
│   │   └── LoadingOverlay.tsx  # Loading indicator
│   │
│   ├── hooks/
│   │   └── useCanvas.ts        # Canvas drawing logic
│   │                           # - Mouse/touch handlers
│   │                           # - Drawing state management
│   │
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   │                       # - Fetch wrapper
│   │   │                       # - Error handling
│   │   ├── canvasUtils.ts      # Canvas utilities
│   │   │                       # - Mask generation
│   │   │                       # - Coordinate transformation
│   │   └── types.ts            # TypeScript interfaces
│   │
│   ├── store/
│   │   └── editorStore.ts      # Zustand state management
│   │                           # - Global state definition
│   │                           # - Actions and mutations
│   │
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Application entry
│   └── index.css               # Global styles + Tailwind
│
├── package.json
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
└── postcss.config.js           # PostCSS configuration
```

---

## Development Workflow

### Running Both Services

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Available Scripts

**Frontend:**

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with HMR |
| `build` | `npm run build` | Type-check and build for production |
| `preview` | `npm run preview` | Preview production build |
| `lint` | `npm run lint` | Run ESLint |

**Backend:**

| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Development server with auto-reload |
| `uvicorn app.main:app` | Production server |
| `pip freeze > requirements.txt` | Update dependencies |

### Hot Reloading

Both frontend and backend support hot reloading:

- **Frontend**: Vite HMR updates components without full page refresh
- **Backend**: Uvicorn `--reload` restarts server on Python file changes

---

## Coding Standards

### TypeScript/React

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `BrushControls.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useCanvas.ts`)
- Utilities: `camelCase.ts` (e.g., `canvasUtils.ts`)

**Component Structure:**
```typescript
// 1. Imports
import { useState, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

// 2. Types (if component-specific)
interface Props {
  // ...
}

// 3. Component
export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks first
  const [state, setState] = useState();
  const storeValue = useEditorStore((s) => s.value);

  // Callbacks
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);

  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

**State Management:**
- Use Zustand for global state (image, drawing, processing)
- Use `useState` for component-local UI state
- Use `useCallback` for event handlers passed to children

### Python

**File Naming:**
- Modules: `snake_case.py` (e.g., `inpaint_service.py`)
- Classes: `PascalCase` (e.g., `LaMaInpainter`)
- Functions/variables: `snake_case` (e.g., `inpaint_image`)

**Code Structure:**
```python
# 1. Standard library imports
import base64
from typing import Optional

# 2. Third-party imports
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# 3. Local imports
from app.utils.image_utils import decode_base64_image

# 4. Constants
DEFAULT_BRUSH_SIZE = 30

# 5. Classes and functions
class InpaintRequest(BaseModel):
    """Request model for inpainting endpoint."""
    image: str
    mask: str

def process_image(image: np.ndarray) -> np.ndarray:
    """Process image array.

    Args:
        image: Input image as numpy array

    Returns:
        Processed image array
    """
    # Implementation
    pass
```

### CSS (Tailwind)

- Use Tailwind utility classes for styling
- Avoid custom CSS unless necessary
- Group related classes logically

```tsx
// Good
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">

// Avoid
<button className="bg-blue-600 rounded-lg px-4 text-white py-2 hover:bg-blue-700 font-medium transition-colors">
```

---

## Testing

### Manual Testing Checklist

**Image Upload:**
- [ ] Drag and drop works
- [ ] File picker works
- [ ] Invalid file types rejected
- [ ] Large images handled

**Drawing:**
- [ ] Brush strokes render correctly
- [ ] Brush size changes work
- [ ] Touch input works (mobile)
- [ ] Cursor preview follows mouse

**History:**
- [ ] Undo removes last stroke
- [ ] Redo restores undone stroke
- [ ] Clear removes all strokes
- [ ] Keyboard shortcuts work (Ctrl+Z, Ctrl+Y)

**Processing:**
- [ ] Loading overlay displays
- [ ] Result displays correctly
- [ ] Download works
- [ ] Edit Again clears result

**Error Handling:**
- [ ] Network errors show message
- [ ] Invalid responses handled
- [ ] Error dismissible

### API Testing with cURL

```bash
# Health check
curl http://localhost:8000/health

# Inpaint (with test images)
curl -X POST http://localhost:8000/api/v1/inpaint \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,...", "mask": "data:image/png;base64,..."}'
```

### API Testing with Swagger UI

1. Open http://localhost:8000/docs
2. Click on `POST /api/v1/inpaint`
3. Click "Try it out"
4. Enter test data
5. Click "Execute"

---

## Debugging

### Frontend Debugging

**React DevTools:**
1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Inspect component state and props

**Zustand DevTools:**
```typescript
// Add to editorStore.ts for debugging
import { devtools } from 'zustand/middleware';

export const useEditorStore = create<EditorState>()(
  devtools((set) => ({
    // ... store definition
  }))
);
```

**Console Logging:**
```typescript
// Temporary debugging
console.log('State:', useEditorStore.getState());
```

### Backend Debugging

**Print Statements:**
```python
print(f"Image shape: {image.shape}")
print(f"Mask values: min={mask.min()}, max={mask.max()}")
```

**Uvicorn Logging:**
```bash
uvicorn app.main:app --reload --log-level debug
```

**Python Debugger:**
```python
import pdb; pdb.set_trace()  # Breakpoint
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS error | Backend not running | Start backend server |
| 404 on /api/v1/inpaint | Wrong URL | Check API_BASE_URL |
| Model download fails | Network/auth issue | Check HuggingFace access |
| Black result image | Mask inverted | Check mask values (white=remove) |
| Slow inference | CPU-only mode | Expected, consider GPU |

---

## Contributing

### Contribution Workflow

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/my-feature`
4. **Make** your changes
5. **Test** thoroughly
6. **Commit** with clear message: `git commit -m "Add feature X"`
7. **Push** to your fork: `git push origin feature/my-feature`
8. **Open** a Pull Request

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(canvas): add touch support for mobile devices
fix(api): handle large images without timeout
docs(readme): update installation instructions
```

### Pull Request Guidelines

- [ ] Code follows project style guidelines
- [ ] All existing tests pass
- [ ] New functionality includes tests
- [ ] Documentation updated if needed
- [ ] PR description explains changes
- [ ] Linked to relevant issue (if applicable)

---

## Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

### Backend

Currently no environment variables required. For production, consider:

```env
MODEL_CACHE_DIR=/path/to/cache
ALLOWED_ORIGINS=https://yourdomain.com
MAX_IMAGE_SIZE=4096
```
