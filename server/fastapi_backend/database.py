from pymongo import MongoClient
from load_env import MONGO_URI

# For MongoDB Atlas, your .env MONGO_URI should look like:
# MONGO_URI=MONGO_URI=mongodb+srv://rameshwarisandile_db_user:Ram123456%40@cluster0.ktakeaj.mongodb.net/mentalwellnesscompanion?retryWrites=true&w=majority
client = MongoClient(MONGO_URI)
db = client.get_default_database() if client.get_default_database() else client["mentalwellnesscompanion"]

# Collections for different features
users_collection = db["users"]
moods_collection = db["moods"]  # For mood entries
chats_collection = db["chats"]  # For chat messages
analytics_collection = db["analytics"]  # For analytics data
