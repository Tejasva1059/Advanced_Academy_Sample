import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import Base, engine, SessionLocal
from app.services.seed_service import seed_database

if __name__ == "__main__":
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding Green Valley International School database...")
        seed_database(db)
        print("Database initialized and seeded successfully!")
    finally:
        db.close()
