from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.inpaint_service import inpaint_image
from app.utils.image_utils import decode_base64_image, encode_image_to_base64


router = APIRouter()


class InpaintRequest(BaseModel):
    image: str  # Base64 encoded image (data:image/png;base64,...)
    mask: str   # Base64 encoded mask (data:image/png;base64,...)


class InpaintResponse(BaseModel):
    result: str  # Base64 encoded result image


@router.post("/inpaint", response_model=InpaintResponse)
async def inpaint(request: InpaintRequest):
    """
    Perform image inpainting using LaMa model.

    The mask should have white pixels (255) where objects should be removed,
    and black pixels (0) where the image should be preserved.
    """
    try:
        # Decode input images
        image = decode_base64_image(request.image)
        mask = decode_base64_image(request.mask)

        # Perform inpainting
        result = inpaint_image(image, mask)

        # Encode result to base64
        result_base64 = encode_image_to_base64(result)

        return InpaintResponse(result=result_base64)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(e)}")
