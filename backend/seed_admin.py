import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.constants import UserRole
from app.core.security import hash_password

def seed_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("Admin user already exists. Updating password...")
            admin.hashed_password = hash_password("admin123")
            db.commit()
            print("Password updated to: admin123")
            print("Username: admin")
        else:
            print("Creating new admin user...")
            new_admin = User(
                username="admin",
                email="admin@example.com",
                full_name="Administrator",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print("Admin user created successfully!")
            print("Username: admin")
            print("Password: admin123")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
