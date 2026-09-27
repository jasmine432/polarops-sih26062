# %%
# STEP 1: Check Python
import sys

print("Python version:", sys.version)


# %%
# STEP 2: Check FastAPI
import fastapi
import uvicorn

print("FastAPI installed successfully")
print("Uvicorn installed successfully")


# %%
# STEP 3: Test basic calculation
print("Backend setup is working")
# %%
# STEP 4: Create FastAPI application

from pathlib import Path

app_folder = Path("app")
app_folder.mkdir(exist_ok=True)

main_code = '''from fastapi import FastAPI

app = FastAPI(
    title="Polar Expedition Logistics Backend",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Polar Logistics Backend is Running"
    }
'''

main_file = app_folder / "main.py"
main_file.write_text(main_code, encoding="utf-8")

print("FastAPI application created successfully!")
print("File location:", main_file)