import os
import httpx
from fastapi import HTTPException, status

DEFAULT_ML_API_URL = "http://127.0.0.1:8000/predict/inventory"
ML_API_URL = os.environ.get("ML_API_URL", DEFAULT_ML_API_URL)


async def predict_inventory(data: dict):
    target_url = os.environ.get("ML_API_URL", ML_API_URL)
    timeout_seconds = float(os.environ.get("ML_TIMEOUT_SECONDS", "30.0"))
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(timeout_seconds, connect=10.0)) as client:
            response = await client.post(
                target_url,
                json=data,
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