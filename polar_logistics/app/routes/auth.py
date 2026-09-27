from fastapi import APIRouter, HTTPException, status

from ..auth import LoginRequest, LoginResponse, authenticate, create_access_token, public_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest) -> LoginResponse:
    """Authenticate one configured prototype demo user."""
    user = authenticate(credentials.identifier, credentials.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    return LoginResponse(access_token=create_access_token(user), user=public_user(user))
