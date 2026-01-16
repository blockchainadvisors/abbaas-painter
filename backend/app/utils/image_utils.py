import base64
import io
import re
from PIL import Image
import numpy as np


def decode_base64_image(data_url: str) -> Image.Image:
    """
    Decode a base64 data URL to a PIL Image.
    Supports format: data:image/png;base64,... or raw base64 string.
    """
    if data_url.startswith("data:"):
        # Extract the base64 part after the comma
        match = re.match(r"data:image/[^;]+;base64,(.+)", data_url)
        if match:
            base64_data = match.group(1)
        else:
            raise ValueError("Invalid data URL format")
    else:
        base64_data = data_url

    image_bytes = base64.b64decode(base64_data)
    image = Image.open(io.BytesIO(image_bytes))
    return image


def encode_image_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """
    Encode a PIL Image to a base64 data URL.
    """
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
    mime_type = f"image/{format.lower()}"
    return f"data:{mime_type};base64,{base64_data}"


def image_to_numpy(image: Image.Image) -> np.ndarray:
    """
    Convert PIL Image to numpy array (RGB format, uint8).
    """
    if image.mode != "RGB":
        image = image.convert("RGB")
    return np.array(image)


def mask_to_numpy(mask: Image.Image) -> np.ndarray:
    """
    Convert PIL Image mask to numpy array (grayscale, uint8).
    White (255) = areas to inpaint, Black (0) = areas to keep.
    """
    if mask.mode != "L":
        mask = mask.convert("L")
    return np.array(mask)


def numpy_to_image(array: np.ndarray) -> Image.Image:
    """
    Convert numpy array to PIL Image.
    """
    if array.dtype != np.uint8:
        array = np.clip(array, 0, 255).astype(np.uint8)
    return Image.fromarray(array)
