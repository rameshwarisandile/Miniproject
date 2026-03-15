How to run your secure FastAPI backend with MongoDB:

1. Open terminal and go to backend folder:
   cd server/fastapi_backend

2. Install dependencies:
   pip install -r requirements.txt

3. Make sure .env file is present with:
   MONGO_URI=mongodb+srv://rameshwarisandile_db_user:Ram123456@@cluster0.ktakeaj.mongodb.net/?appName=Cluster0
   JWT_SECRET=your_jwt_secret_here

4. Start the FastAPI server:
   uvicorn main:app --reload

5. Test APIs:
   - Signup: POST http://localhost:8000/api/auth/signup
   - Login: POST http://localhost:8000/api/auth/login

All user data will be securely stored in MongoDB.
