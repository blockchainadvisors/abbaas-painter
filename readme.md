<div align="center">

# Abbaas Painter

**AI-Powered Image Inpainting Web Application**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

Remove unwanted objects, text, or blemishes from your images using state-of-the-art deep learning. Simply brush over what you want gone, and let the LaMa model work its magic.

[Quick Start](#quick-start) | [Documentation](#documentation) | [API Reference](docs/api-reference.md) | [Contributing](#contributing)

</div>

---

## Features

### Core Functionality
- **Drag-and-drop image upload** - Supports PNG, JPG, and WEBP formats
- **Interactive canvas drawing** - Two-layer canvas system with real-time feedback
- **Adjustable brush size** - Slider control (5-100px) with circular cursor preview
- **Undo/Redo support** - Full history with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **Clear mask** - Reset all brush strokes instantly
- **Download processed images** - Save AI-generated results
- **Mobile/tablet support** - Full touch support for mobile devices

### User Interface
- Real-time brush preview showing exact stroke size
- Semi-transparent red overlay for mask visualization
- Loading overlay during AI processing
- Error handling with dismissible banners
- Result preview modal with download and edit-again options

## Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript 5.9** - Full type safety
- **Vite 7** - Fast build tool with HMR
- **Tailwind CSS 3** - Utility-first styling
- **Zustand 5** - Lightweight state management

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI web server
- **PyTorch** - Deep learning framework
- **Pillow** - Image processing
- **HuggingFace Hub** - Model hosting

### AI Model
- **LaMa (Large Mask Inpainting)** - State-of-the-art inpainting model (~200MB)
- Downloaded automatically from HuggingFace Hub on first use
- CPU inference supported (no GPU required)

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The LaMa model (~200MB) will be downloaded automatically on the first inpainting request.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 to use the application.

## API Reference

### Inpaint Endpoint

**POST** `/api/v1/inpaint`

Performs AI-powered image inpainting using the LaMa model.

**Request Body:**
```json
{
  "image": "data:image/png;base64,...",
  "mask": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "result": "data:image/png;base64,..."
}
```

**Mask Format:**
- Black pixels (0) = Areas to preserve
- White pixels (255) = Areas to remove/inpaint

**Status Codes:**
- `200` - Success
- `400` - Invalid image data
- `500` - Processing failure

### Health Check

**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "abbaas-painter"
}
```

### Root Endpoint

**GET** `/`

Returns service information with links to documentation.

## Project Structure

```
abbaas-painter/
├── frontend/
│   ├── src/
│   │   ├── components/          # React UI components
│   │   │   ├── Canvas.tsx       # Displays uploaded image
│   │   │   ├── MaskCanvas.tsx   # Interactive drawing layer
│   │   │   ├── BrushControls.tsx# Brush size, undo/redo controls
│   │   │   ├── ImageUpload.tsx  # Drag-and-drop upload
│   │   │   ├── ProcessButton.tsx# Initiates inpainting
│   │   │   ├── ResultDisplay.tsx# Result modal
│   │   │   └── LoadingOverlay.tsx
│   │   ├── hooks/
│   │   │   └── useCanvas.ts     # Canvas drawing logic
│   │   ├── lib/
│   │   │   ├── api.ts           # Backend API client
│   │   │   ├── canvasUtils.ts   # Canvas utilities
│   │   │   └── types.ts         # TypeScript interfaces
│   │   ├── store/
│   │   │   └── editorStore.ts   # Zustand state store
│   │   ├── App.tsx              # Main application
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & CORS config
│   │   ├── api/
│   │   │   └── routes.py        # API endpoint definitions
│   │   ├── services/
│   │   │   └── inpaint_service.py # LaMa model integration
│   │   └── utils/
│   │       └── image_utils.py   # Image encoding/decoding
│   └── requirements.txt
├── .gitignore
└── README.md
```

## Environment Variables

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

## Development

### Frontend Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # TypeScript check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend Development

The backend runs with auto-reload enabled by default during development:

```bash
uvicorn app.main:app --reload --port 8000
```

### CORS Configuration

The backend allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

## How It Works

1. **Image Upload**: User uploads an image via drag-and-drop or file picker
2. **Mask Drawing**: User draws over areas to remove using the brush tool
3. **Processing**: Frontend sends base64-encoded image and mask to the API
4. **Inpainting**: Backend processes using the LaMa model:
   - Mask is binarized and dilated for better edge blending
   - Image is padded to multiples of 8 (model requirement)
   - Inference runs with masked regions zeroed out
   - Result is composited with original image
5. **Result**: Processed image is displayed with download option

---

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| **[Architecture](docs/architecture.md)** | System design, component overview, and data flow diagrams |
| **[API Reference](docs/api-reference.md)** | Complete REST API specification with examples |
| **[Development Guide](docs/development.md)** | Setup, coding standards, and contribution workflow |
| **[Deployment Guide](docs/deployment.md)** | Docker, cloud platforms, and production configuration |
| **[Troubleshooting](docs/troubleshooting.md)** | Common issues and their solutions |

---

## Contributing

We welcome contributions! Please see our [Development Guide](docs/development.md) for detailed instructions on:

- Setting up your development environment
- Code style and conventions
- Pull request process
- Testing requirements

---

## Acknowledgments

- **[LaMa](https://github.com/advimman/lama)** - Resolution-robust Large Mask Inpainting with Fourier Convolutions (WACV 2022)
- **[HuggingFace](https://huggingface.co/)** - Model hosting and distribution
- **[fashn-ai/LaMa](https://huggingface.co/fashn-ai/LaMa)** - Pre-trained model weights

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Abbaas Painter** — Remove anything from your images with AI

Made with PyTorch, React, and FastAPI

</div>
