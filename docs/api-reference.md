# API Reference

This document provides the complete REST API specification for Abbaas Painter.

---

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Inpaint Image](#inpaint-image)
  - [Health Check](#health-check)
  - [Root](#root)
- [Data Types](#data-types)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## Overview

The Abbaas Painter API is a RESTful service that provides AI-powered image inpainting capabilities. It accepts images and masks in Base64 format and returns processed images.

| Attribute | Value |
|-----------|-------|
| Protocol | HTTP/HTTPS |
| Format | JSON |
| Encoding | UTF-8 |
| Image Format | Base64 Data URLs |

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Production | Configure via deployment |

---

## Authentication

The API currently does not require authentication. All endpoints are publicly accessible.

> **Note:** For production deployments, consider implementing API key authentication or OAuth2.

---

## Endpoints

### Inpaint Image

Performs AI-powered image inpainting using the LaMa model to remove objects or fill regions.

```
POST /api/v1/inpaint
```

#### Request

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes |

**Body:**

```json
{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "mask": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | Yes | Base64-encoded source image as data URL |
| `mask` | string | Yes | Base64-encoded mask image as data URL |

**Mask Specification:**

The mask must be a grayscale image where:

| Pixel Value | Meaning |
|-------------|---------|
| `0` (Black) | Preserve original pixels |
| `255` (White) | Inpaint/remove these pixels |

Intermediate values (1-254) are binarized using threshold 127.

**Supported Image Formats:**

- PNG (`image/png`)
- JPEG (`image/jpeg`)
- WebP (`image/webp`)

#### Response

**Success (200 OK):**

```json
{
  "result": "data:image/png;base64,iVBORw0KGgo..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `result` | string | Base64-encoded inpainted image as PNG data URL |

**Error (4xx/5xx):**

```json
{
  "detail": "Error message describing what went wrong"
}
```

#### Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Image processed successfully |
| `400` | Bad Request - Invalid image data or format |
| `422` | Validation Error - Missing required fields |
| `500` | Internal Server Error - Processing failed |

---

### Health Check

Returns the health status of the service.

```
GET /health
```

#### Request

No parameters required.

#### Response

**Success (200 OK):**

```json
{
  "status": "healthy",
  "service": "abbaas-painter"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Health status (`healthy`) |
| `service` | string | Service identifier |

---

### Root

Returns service information and available endpoints.

```
GET /
```

#### Request

No parameters required.

#### Response

**Success (200 OK):**

```json
{
  "message": "Welcome to Abbaas Painter API",
  "docs": "/docs",
  "health": "/health"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Welcome message |
| `docs` | string | Path to OpenAPI documentation |
| `health` | string | Path to health check endpoint |

---

## Data Types

### InpaintRequest

```typescript
interface InpaintRequest {
  image: string;  // Base64 data URL
  mask: string;   // Base64 data URL
}
```

### InpaintResponse

```typescript
interface InpaintResponse {
  result: string;  // Base64 data URL (PNG)
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  detail: string;  // Error description
}
```

### HealthResponse

```typescript
interface HealthResponse {
  status: string;   // "healthy"
  service: string;  // "abbaas-painter"
}
```

---

## Error Handling

### Error Response Format

All errors return a JSON object with a `detail` field:

```json
{
  "detail": "Human-readable error message"
}
```

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| `400` | Invalid image data | Malformed Base64 or corrupt image | Verify image encoding |
| `400` | Invalid data URL format | Missing `data:image/...;base64,` prefix | Include full data URL |
| `422` | Field required | Missing `image` or `mask` field | Include all required fields |
| `500` | Inpainting failed | Model inference error | Check server logs |
| `500` | Model loading failed | HuggingFace download error | Check network/disk space |

### Error Handling Example

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/inpaint",
    json={"image": image_base64, "mask": mask_base64}
)

if response.status_code == 200:
    result = response.json()["result"]
elif response.status_code == 400:
    error = response.json()["detail"]
    print(f"Invalid input: {error}")
elif response.status_code == 500:
    error = response.json()["detail"]
    print(f"Server error: {error}")
```

---

## Rate Limiting

The default configuration does not implement rate limiting. For production deployments, consider adding rate limiting middleware.

**Recommended limits:**

| Tier | Requests/Minute | Max Image Size |
|------|-----------------|----------------|
| Free | 10 | 2048x2048 |
| Standard | 60 | 4096x4096 |
| Premium | Unlimited | 8192x8192 |

---

## Examples

### cURL

**Inpaint Request:**

```bash
curl -X POST "http://localhost:8000/api/v1/inpaint" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,'$(base64 -w0 input.png)'",
    "mask": "data:image/png;base64,'$(base64 -w0 mask.png)'"
  }'
```

**Health Check:**

```bash
curl http://localhost:8000/health
```

### Python

```python
import base64
import requests

def encode_image(path: str) -> str:
    """Encode image file to base64 data URL."""
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return f"data:image/png;base64,{data}"

def inpaint(image_path: str, mask_path: str) -> bytes:
    """Send inpainting request and return result image bytes."""
    response = requests.post(
        "http://localhost:8000/api/v1/inpaint",
        json={
            "image": encode_image(image_path),
            "mask": encode_image(mask_path)
        }
    )
    response.raise_for_status()

    # Decode result
    result_data = response.json()["result"]
    # Remove data URL prefix
    base64_data = result_data.split(",")[1]
    return base64.b64decode(base64_data)

# Usage
result_bytes = inpaint("photo.jpg", "mask.png")
with open("result.png", "wb") as f:
    f.write(result_bytes)
```

### JavaScript/TypeScript

```typescript
async function inpaint(imageFile: File, maskCanvas: HTMLCanvasElement): Promise<string> {
  // Convert file to base64
  const imageBase64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(imageFile);
  });

  // Get mask as base64
  const maskBase64 = maskCanvas.toDataURL("image/png");

  // Send request
  const response = await fetch("http://localhost:8000/api/v1/inpaint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageBase64,
      mask: maskBase64
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  const data = await response.json();
  return data.result;  // Base64 data URL
}
```

---

## OpenAPI Specification

Interactive API documentation is available at:

| Format | URL |
|--------|-----|
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |
| OpenAPI JSON | `http://localhost:8000/openapi.json` |

---

## Versioning

The API uses URL path versioning:

| Version | Base Path | Status |
|---------|-----------|--------|
| v1 | `/api/v1/` | Current |

Future versions will be introduced at new paths (e.g., `/api/v2/`) while maintaining backwards compatibility with existing versions.
