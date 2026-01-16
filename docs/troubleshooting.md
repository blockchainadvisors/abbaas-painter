# Troubleshooting Guide

This guide provides solutions to common issues encountered when using or developing Abbaas Painter.

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Runtime Issues](#runtime-issues)
- [Image Processing Issues](#image-processing-issues)
- [UI/UX Issues](#uiux-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check Commands

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if frontend is accessible
curl http://localhost:5173

# Check backend logs
# (if using uvicorn directly)
# Logs appear in terminal

# Check if model is downloaded
ls -la ~/.cache/huggingface/hub/models--fashn-ai--LaMa/
```

### System Requirements Verification

```bash
# Python version (need 3.12+)
python3 --version

# Node.js version (need 18+)
node --version

# Available memory
free -h

# Available disk space
df -h
```

---

## Installation Issues

### Python Virtual Environment Fails

**Symptom:**
```
The virtual environment was not created successfully because ensurepip is not available.
```

**Solution:**
```bash
# Ubuntu/Debian
sudo apt install python3.12-venv

# Fedora
sudo dnf install python3.12-venv

# Then retry
python3.12 -m venv venv
```

---

### pip Install Fails with "No module named pip"

**Symptom:**
```
/usr/bin/python3: No module named pip
```

**Solution:**
```bash
# Ubuntu/Debian
sudo apt install python3-pip

# Or use ensurepip
python3 -m ensurepip --upgrade
```

---

### Node.js/npm Not Found

**Symptom:**
```
npm: command not found
```

**Solution:**
```bash
# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

---

### PyTorch Installation Issues

**Symptom:**
```
ERROR: Could not find a version that satisfies the requirement torch
```

**Solution:**
```bash
# Install CPU version explicitly
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Or for CUDA support
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

---

### Frontend Build Fails - TypeScript Errors

**Symptom:**
```
error TS1484: 'X' is a type and must be imported using a type-only import
```

**Solution:**
Change imports to use `type` keyword:
```typescript
// Before
import { SomeType } from './types';

// After
import type { SomeType } from './types';
```

---

## Runtime Issues

### Backend Won't Start - Port in Use

**Symptom:**
```
ERROR: [Errno 98] Address already in use
```

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --port 8001
```

---

### Frontend Can't Connect to Backend (CORS Error)

**Symptom:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Causes & Solutions:**

1. **Backend not running:**
   ```bash
   cd backend && source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Wrong port configured:**
   Check `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:8000
   ```

3. **CORS origins not configured:**
   Verify `backend/app/main.py` includes your frontend origin.

---

### Model Download Fails (401/404 Error)

**Symptom:**
```
401 Client Error: Repository Not Found
```
or
```
404 Client Error: Entry Not Found
```

**Solution:**

The model repository may have changed. Update `inpaint_service.py`:

```python
model_path = hf_hub_download(
    repo_id="fashn-ai/LaMa",  # Use this repository
    filename="big-lama.pt"
)
```

Alternative repositories:
- `fashn-ai/LaMa`
- `xingren23/comfyflow-models` (path: `inpaint/big-lama.pt`)

---

### Model Loading Fails - Out of Memory

**Symptom:**
```
RuntimeError: [Errno 12] Cannot allocate memory
```

**Solution:**

1. **Close other applications** to free memory

2. **Increase swap space:**
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **Use a smaller model** (if available)

---

### "scipy" Module Not Found

**Symptom:**
```
ModuleNotFoundError: No module named 'scipy'
```

**Solution:**
```bash
source venv/bin/activate
pip install scipy
```

---

## Image Processing Issues

### Inpainted Area is Black/Wrong Color

**Symptom:**
The removed area shows as a solid color instead of blending with surroundings.

**Causes & Solutions:**

1. **Mask values inverted:**
   - White (255) = area to remove
   - Black (0) = area to keep

   Check mask generation in `canvasUtils.ts`.

2. **Image not preprocessed correctly:**
   The masked region should be zeroed before inference. Verify in `inpaint_service.py`:
   ```python
   image_tensor = image_tensor * (1 - mask_tensor)
   ```

3. **Result not composited:**
   Ensure final compositing:
   ```python
   final_result = (result * mask_3ch + original_image * (1 - mask_3ch))
   ```

---

### Inpainted Area Has Visible Seams

**Symptom:**
The boundary between original and inpainted areas is visible.

**Solutions:**

1. **Increase mask dilation:**
   ```python
   mask_dilated = ndimage.binary_dilation(mask_binary > 0, iterations=4)  # Was 2
   ```

2. **Use feathered mask edges** (advanced):
   ```python
   from scipy.ndimage import gaussian_filter
   mask_float = gaussian_filter(mask_float, sigma=2)
   ```

---

### Processing Takes Too Long

**Symptom:**
Inpainting request takes 30+ seconds.

**Causes & Solutions:**

1. **CPU-only inference is slow** - expected behavior. Consider:
   - Using GPU if available
   - Reducing image size before processing
   - Adding progress feedback to UI

2. **Large image size:**
   Add client-side resizing:
   ```typescript
   const MAX_DIMENSION = 1024;
   // Resize if larger
   ```

---

### Result Image Quality is Poor

**Symptom:**
Inpainted areas look blurry or unrealistic.

**Solutions:**

1. **Don't over-compress images** - use PNG format
2. **Ensure mask covers entire object** including shadows
3. **Use appropriate brush size** - not too small, not too large
4. **Model limitation** - LaMa works best on:
   - Smaller masked regions
   - Textured backgrounds
   - Non-semantic content (text, objects)

---

## UI/UX Issues

### Brush Strokes Not Appearing

**Symptom:**
Drawing on canvas produces no visible strokes.

**Solutions:**

1. **Check canvas dimensions:**
   ```typescript
   console.log('Canvas size:', canvas.width, canvas.height);
   ```

2. **Verify drawing state:**
   ```typescript
   console.log('Is drawing:', isDrawing);
   console.log('Current line:', currentLine);
   ```

3. **Check stroke style:**
   Verify `ctx.strokeStyle` is set (should be semi-transparent red).

---

### Cursor Preview Not Showing

**Symptom:**
No circle following the mouse cursor.

**Solution:**
Check `MaskCanvas.tsx` for cursor position tracking and rendering.

---

### Undo/Redo Not Working

**Symptom:**
Keyboard shortcuts or buttons don't undo/redo strokes.

**Solutions:**

1. **Check keyboard event listener:**
   ```typescript
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey);
       // ...
     };
   }, []);
   ```

2. **Verify history state:**
   ```typescript
   console.log('Line groups:', lineGroups.length);
   console.log('Redo stack:', redoStack.length);
   ```

---

### Image Upload Not Working

**Symptom:**
Drag-drop or file picker doesn't load images.

**Solutions:**

1. **Check file type:**
   ```typescript
   console.log('File type:', file.type);  // Should start with 'image/'
   ```

2. **Check for JavaScript errors** in browser console

3. **Verify file reader:**
   ```typescript
   reader.onerror = (e) => console.error('FileReader error:', e);
   ```

---

### Mobile Touch Not Working

**Symptom:**
Cannot draw on mobile/tablet devices.

**Solution:**
Verify touch event handlers in `useCanvas.ts`:
```typescript
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);
```

The `passive: false` is important to allow `preventDefault()`.

---

## Performance Issues

### Frontend is Laggy While Drawing

**Symptom:**
Noticeable delay between mouse movement and stroke appearing.

**Solutions:**

1. **Reduce redraw frequency:**
   Use `requestAnimationFrame` for smooth drawing.

2. **Optimize canvas clearing:**
   Only clear and redraw the affected region.

3. **Large image causing slowness:**
   Display scaled-down version, process full resolution.

---

### Backend Memory Keeps Growing

**Symptom:**
Backend process memory usage increases over time.

**Solutions:**

1. **Force garbage collection:**
   ```python
   import gc
   gc.collect()
   ```

2. **Clear PyTorch cache:**
   ```python
   torch.cuda.empty_cache()  # If using GPU
   ```

3. **Check for memory leaks** in image handling code.

---

## Deployment Issues

### Docker Build Fails

**Symptom:**
Various errors during `docker build`.

**Common Solutions:**

1. **Out of disk space:**
   ```bash
   docker system prune -a
   ```

2. **Network issues downloading packages:**
   Add retry logic or use local mirror.

3. **Permission denied:**
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

---

### 502 Bad Gateway in Production

**Symptom:**
Nginx returns 502 error.

**Solutions:**

1. **Backend not running:**
   ```bash
   sudo systemctl status abbaas-backend
   sudo systemctl start abbaas-backend
   ```

2. **Wrong proxy configuration:**
   Verify `proxy_pass` URL in nginx config.

3. **Backend crashed:**
   Check logs:
   ```bash
   sudo journalctl -u abbaas-backend -f
   ```

---

### Request Timeout on Large Images

**Symptom:**
504 Gateway Timeout for large images.

**Solution:**
Increase timeout in nginx:
```nginx
proxy_read_timeout 300s;
proxy_connect_timeout 75s;
```

---

## Getting Help

### Collecting Debug Information

When reporting issues, include:

1. **Environment info:**
   ```bash
   python3 --version
   node --version
   npm --version
   uname -a
   ```

2. **Error messages:** Full stack trace

3. **Steps to reproduce:** Detailed sequence

4. **Screenshots:** For UI issues

### Where to Get Help

1. **GitHub Issues:** Report bugs and feature requests
2. **Documentation:** Check all docs in `/docs` folder
3. **API Docs:** http://localhost:8000/docs for API issues

### Useful Debugging Commands

```bash
# Backend verbose logging
uvicorn app.main:app --reload --log-level debug

# Check Python environment
pip list | grep -E "torch|fastapi|pillow"

# Frontend dependency check
npm ls zustand react

# Network debugging
curl -v http://localhost:8000/health
```
