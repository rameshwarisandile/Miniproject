import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://rameshwarisandile_db_user:Ram123456%40@cluster0.ktakeaj.mongodb.net/mentalwellnesscompanion")
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_here")
