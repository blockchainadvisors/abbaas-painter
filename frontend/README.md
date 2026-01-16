# Abbaas Painter - Frontend

React-based frontend for the Abbaas Painter AI inpainting application.

## Tech Stack

- **React 19.2** - Modern React with latest features
- **TypeScript 5.9** - Full type safety
- **Vite 7.2** - Fast build tool with Hot Module Replacement
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Zustand 5.0** - Lightweight state management
- **ESLint 9** - Code quality and linting

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React UI components
│   │   ├── Canvas.tsx        # Displays the uploaded image
│   │   ├── MaskCanvas.tsx    # Interactive drawing layer with brush preview
│   │   ├── BrushControls.tsx # Brush size, undo/redo, clear controls
│   │   ├── ImageUpload.tsx   # Drag-and-drop image upload
│   │   ├── ProcessButton.tsx # Initiates inpainting request
│   │   ├── ResultDisplay.tsx # Modal showing processed result
│   │   └── LoadingOverlay.tsx# Loading indicator during processing
│   ├── hooks/
│   │   └── useCanvas.ts      # Custom hook for canvas drawing logic
│   ├── lib/
│   │   ├── api.ts            # Backend API client
│   │   ├── canvasUtils.ts    # Canvas drawing utilities
│   │   └── types.ts          # TypeScript interfaces
│   ├── store/
│   │   └── editorStore.ts    # Zustand state store
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles with Tailwind
├── public/                    # Static assets
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript root config
├── tsconfig.app.json         # App-specific TypeScript config
├── tsconfig.node.json        # Node/Vite TypeScript config
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── eslint.config.js          # ESLint configuration
└── index.html                # HTML entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at http://localhost:5173 with hot module replacement.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Features

### Image Upload
- Drag-and-drop or click-to-upload interface
- Supports PNG, JPG, and WEBP formats
- Visual feedback with blue border on drag

### Interactive Canvas
- Two-layer canvas system:
  - Base canvas displays the uploaded image
  - Drawing canvas handles user brush strokes
- Supports both mouse and touch events

### Brush Tool
- Adjustable size (5-100px) via slider
- Real-time circular cursor preview
- Semi-transparent red stroke visualization

### History Management
- Undo: Ctrl/Cmd+Z
- Redo: Ctrl/Cmd+Y
- Clear: Remove all strokes

### API Integration
- Single endpoint: `POST /api/v1/inpaint`
- Health check: `GET /health`
- Configurable via `VITE_API_URL` environment variable

### Result Display
- Modal with processed image preview
- Download button for saving results
- Edit again button to continue working

## State Management

The application uses Zustand for centralized state management:

**Image State:**
- `imageFile` - Uploaded file
- `imageElement` - HTMLImageElement
- `imageDimensions` - Width and height

**Drawing State:**
- `lineGroups` - Array of completed brush strokes
- `currentLine` - Points of stroke in progress
- `brushSize` - Current brush size setting
- `isDrawing` - Whether user is actively drawing

**History:**
- `redoStack` - Strokes for redo functionality

**Processing State:**
- `isProcessing` - Loading state during API call
- `resultImage` - Base64 result from backend
- `error` - Error messages

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

## TypeScript Configuration

- Strict mode enabled
- Target ES2022
- JSX React 17+ new transform
- Bundler module resolution

## Canvas Implementation

The drawing system uses a dual canvas approach:

1. **Display Canvas**: Shows original image (non-interactive)
2. **Mask Canvas**: Handles user input and rendering

Key utilities in `canvasUtils.ts`:
- `fileToBase64()` - Converts image files to base64
- `canvasToBase64()` - Exports canvas as PNG data URL
- `getCanvasCoordinates()` - Accounts for CSS scaling
- `generateMask()` - Creates binary mask from brush strokes
- `drawMaskOverlay()` - Renders visual feedback of strokes
- `loadImage()` - Loads image file into HTMLImageElement
