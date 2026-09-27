import os
from sqlalchemy import create_engine

DEFAULT_DATABASE_URL = "postgresql+psycopg2://postgres:jasmine2006@localhost:5432/polar_logistics"
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

print("Database configuration created!")