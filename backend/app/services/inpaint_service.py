import numpy as np
import torch
from huggingface_hub import hf_hub_download
from PIL import Image


class LaMaInpainter:
    """
    LaMa (Large Mask Inpainting) model wrapper for CPU inference.
    Downloads the model from HuggingFace Hub on first use.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.device = torch.device("cpu")
        self.model = None

    def _load_model(self):
        """Lazily load the LaMa model."""
        if self.model is not None:
            return

        print("Downloading LaMa model from HuggingFace Hub...")
        model_path = hf_hub_download(
            repo_id="fashn-ai/LaMa",
            filename="big-lama.pt"
        )
        print(f"Loading model from {model_path}...")
        self.model = torch.jit.load(model_path, map_location=self.device)
        self.model.eval()
        print("Model loaded successfully!")

    def _pad_to_multiple(self, img: np.ndarray, multiple: int = 8) -> tuple[np.ndarray, tuple[int, int]]:
        """Pad image dimensions to be multiples of a given number."""
        h, w = img.shape[:2]
        pad_h = (multiple - h % multiple) % multiple
        pad_w = (multiple - w % multiple) % multiple

        if len(img.shape) == 3:
            padded = np.pad(img, ((0, pad_h), (0, pad_w), (0, 0)), mode="reflect")
        else:
            padded = np.pad(img, ((0, pad_h), (0, pad_w)), mode="reflect")

        return padded, (h, w)

    def inpaint(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """
        Perform inpainting on the image using the mask.

        Args:
            image: RGB image as numpy array (H, W, 3), uint8
            mask: Grayscale mask as numpy array (H, W), uint8
                  White (255) = areas to inpaint, Black (0) = areas to keep

        Returns:
            Inpainted image as numpy array (H, W, 3), uint8
        """
        self._load_model()

        # Store original image for compositing
        original_image = image.copy()

        # Binarize mask (threshold at 127)
        mask_binary = (mask > 127).astype(np.uint8) * 255

        # Dilate mask slightly for better blending at edges
        from scipy import ndimage
        mask_dilated = ndimage.binary_dilation(mask_binary > 0, iterations=2).astype(np.uint8) * 255

        # Pad to multiple of 8 for the model
        image_padded, (orig_h, orig_w) = self._pad_to_multiple(image, 8)
        mask_padded, _ = self._pad_to_multiple(mask_dilated, 8)

        # Normalize image to [0, 1] and convert to tensor
        image_tensor = torch.from_numpy(image_padded).float() / 255.0
        image_tensor = image_tensor.permute(2, 0, 1).unsqueeze(0)  # (1, 3, H, W)

        # Normalize mask to [0, 1] and convert to tensor
        mask_tensor = torch.from_numpy(mask_padded).float() / 255.0
        mask_tensor = mask_tensor.unsqueeze(0).unsqueeze(0)  # (1, 1, H, W)

        # Zero out masked regions in input image (LaMa expects this)
        image_tensor = image_tensor * (1 - mask_tensor)

        # Move to device
        image_tensor = image_tensor.to(self.device)
        mask_tensor = mask_tensor.to(self.device)

        # Run inference
        with torch.no_grad():
            result = self.model(image_tensor, mask_tensor)

        # Convert back to numpy
        result = result.squeeze(0).permute(1, 2, 0).cpu().numpy()
        result = np.clip(result * 255, 0, 255).astype(np.uint8)

        # Crop to original size
        result = result[:orig_h, :orig_w, :]

        # Composite: use inpainted result in masked areas, original elsewhere
        mask_float = mask_dilated[:orig_h, :orig_w].astype(np.float32) / 255.0
        mask_3ch = np.stack([mask_float] * 3, axis=-1)

        final_result = (result * mask_3ch + original_image * (1 - mask_3ch)).astype(np.uint8)

        return final_result


# Global singleton instance
_inpainter: LaMaInpainter | None = None


def get_inpainter() -> LaMaInpainter:
    """Get the singleton LaMaInpainter instance."""
    global _inpainter
    if _inpainter is None:
        _inpainter = LaMaInpainter()
    return _inpainter


def inpaint_image(image: Image.Image, mask: Image.Image) -> Image.Image:
    """
    High-level function to inpaint an image.

    Args:
        image: PIL Image (RGB)
        mask: PIL Image (grayscale, white = inpaint areas)

    Returns:
        Inpainted PIL Image
    """
    from app.utils.image_utils import image_to_numpy, mask_to_numpy, numpy_to_image

    inpainter = get_inpainter()

    # Convert to numpy
    image_np = image_to_numpy(image)
    mask_np = mask_to_numpy(mask)

    # Resize mask to match image if needed
    if mask_np.shape[:2] != image_np.shape[:2]:
        mask_pil = Image.fromarray(mask_np)
        mask_pil = mask_pil.resize((image_np.shape[1], image_np.shape[0]), Image.NEAREST)
        mask_np = np.array(mask_pil)

    # Perform inpainting
    result_np = inpainter.inpaint(image_np, mask_np)

    # Convert back to PIL
    return numpy_to_image(result_np)
