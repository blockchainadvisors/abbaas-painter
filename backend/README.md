# Abbaas Painter - Backend

FastAPI backend for the Abbaas Painter AI inpainting application, powered by the LaMa model.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI web server
- **PyTorch 2.0+** - Deep learning framework
- **Pillow 10+** - Image processing
- **NumPy 1.24+** - Numerical computing
- **SciPy 1.10+** - Scientific computing (image processing)
- **HuggingFace Hub** - Model downloading

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app initialization & CORS config
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py              # API endpoint definitions
│   ├── services/
│   │   ├── __init__.py
│   │   └── inpaint_service.py     # LaMa inpainting implementation
│   └── utils/
│       ├── __init__.py
│       └── image_utils.py         # Image encoding/decoding utilities
├── requirements.txt               # Python dependencies
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12+
- pip

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Server

```bash
uvicorn app.main:app --reload --port 8000
```

The server runs at http://localhost:8000 with auto-reload enabled.

**Note:** The LaMa model (~200MB) will be downloaded automatically from HuggingFace Hub on the first inpainting request.

## API Endpoints

### Inpaint

**POST** `/api/v1/inpaint`

Performs AI-powered image inpainting.

**Request:**
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

```json
{
  "status": "healthy",
  "service": "abbaas-painter"
}
```

### Root

**GET** `/`

Returns service information with documentation links.

## Architecture

### Stateless Design
- No database or session management
- Images processed on-the-fly
- No persistent storage

### Model Management
- **Singleton Pattern**: Single model instance in memory
- **Lazy Loading**: Model downloaded only on first inference
- **CPU Inference**: No GPU required

### CORS Configuration

Allowed origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

## Inpainting Pipeline

The `LaMaInpainter` class in `inpaint_service.py` implements:

1. **Mask Preprocessing**
   - Binarization (threshold at 127)
   - Dilation (2 iterations) for better edge blending

2. **Image Preparation**
   - Padding to multiples of 8 (model requirement)
   - Normalization to [0, 1] range
   - Conversion to PyTorch tensor (1, 3, H, W)

3. **Inference**
   - Masked regions zeroed out in input
   - `torch.no_grad()` for efficiency
   - TorchScript model execution

4. **Post-processing**
   - Conversion back to numpy uint8
   - Cropping to original dimensions
   - Compositing: inpainted result in masked areas, original elsewhere

## Image Utilities

`image_utils.py` provides:

- `decode_base64_image()` - Handles data URLs and raw base64
- `encode_image_to_base64()` - Converts PIL Image to base64 data URL (PNG)
- `image_to_numpy()` - PIL RGB to uint8 numpy array
- `mask_to_numpy()` - PIL grayscale to uint8 numpy array
- `numpy_to_image()` - uint8 numpy array to PIL Image

## Dependencies

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-multipart>=0.0.6
torch>=2.0.0
numpy>=1.24.0
Pillow>=10.0.0
huggingface_hub>=0.20.0
scipy>=1.10.0
```

## Model Information

- **Model**: LaMa (Large Mask Inpainting)
- **Source**: `fashn-ai/LaMa` on HuggingFace Hub
- **File**: `big-lama.pt` (~200MB)
- **Loading**: TorchScript via `torch.jit.load()`
- **Inference**: CPU-only (configurable)

## Development

### Auto-reload

The `--reload` flag enables automatic server restart on code changes:

```bash
uvicorn app.main:app --reload --port 8000
```

### API Documentation

FastAPI provides automatic API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
