import os
import httpx
from fastapi import HTTPException, status

DEFAULT_ML_API_URL = "http://127.0.0.1:8000/predict/inventory"
ML_API_URL = os.environ.get("ML_API_URL", DEFAULT_ML_API_URL)


async def predict_inventory(data: dict):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                ML_API_URL,
                json=data,
                timeout=10.0
            )

            response.raise_for_status()

            return response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"ML Service error: {exc.response.text}",
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML Service unavailable: {str(exc)}",
        )