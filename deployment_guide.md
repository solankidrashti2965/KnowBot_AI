# 🚀 Deployment Guide: Taking KnowBase AI to Production

To transform **KnowBase AI** into a real-world product available to everyone, follow these steps. We will focus on a **Zero-Cost Deployment** strategy using industry-leading platforms.

---

## 1. 🗄️ Database: MongoDB Atlas (Cloud)
Currently, you are using a local JSON-based persistent DB. For a real product, you should use **MongoDB Atlas**.
1. Create a free account at [mongodb.com](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster (Shared/Free).
3. Under **Network Access**, add `0.0.0.0/0` (or your backend's IP).
4. Under **Database Access**, create a user and password.
5. Get your **Connection String** (e.g., `mongodb+srv://...`).
6. **Update Code**: Update `backend/database.py` to use `motor` with your Atlas connection string.

---

## 2. 🧠 Vector Store: Scaling FAISS
For a production app:
- **Option A (Simple)**: Keep FAISS but ensure your backend server (Render/Railway/HF) has a **Persistent Volume** so the index isn't lost on restart.
- **Option B (Recommended)**: Switch to **Pinecone** or **AstraDB** (Vector DBs). These have free tiers and handle scaling automatically.

---

## 3. ⚙️ Backend: Deploy to Render or Railway
Render is excellent for FastAPI.
1. Push your code to GitHub.
2. Link your repo to [Render.com](https://render.com).
3. Choose **Web Service**.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**: Add your keys in the Dashboard:
   - `GROQ_API_KEY`
   - `JWT_SECRET`
   - `MONGODB_URI`
   - `FRONTEND_URL` (Set this to your production frontend link)

---

## 4. 🎨 Frontend: Deploy to Vercel
Vercel is the gold standard for React apps.
1. Push your code to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. **Environment Variables**:
   - `VITE_API_URL`: Set this to your Render Backend URL (e.g., `https://knowbase-api.onrender.com`).
4. **Build Settings**: Vercel will auto-detect Vite. Click **Deploy**.

---

## 5. 🌐 Domain & SSL
1. **Custom Domain**: Connect a domain in Vercel/Render settings (e.g., `app.knowbase.com`).
2. **SSL**: Automatic HTTPS is provided by both platforms for free.

---

## 🛠️ Security & Scaling
- [ ] **JWT Secret**: Use a 32+ character random string.
- [ ] **CORS**: Verify that `FRONTEND_URL` in the backend correctly matches your live frontend.
- [ ] **Groq Usage**: Monitor your free-tier limits on the Groq Console.
- [ ] **Cold Starts**: Free tier servers (like Render) sleep after 15 mins of inactivity. Use a "cron-job" ping or upgrade to a paid tier ($7/mo) to keep it alive.

---

### 💡 Status
Your code is now optimized with:
- **Lime Yellow / Dark Purple** Solid Theme (No glassmorphism).
- **Multi-Format Support** (PDF, Word, PPT, TXT, Images).
- **Sid AI** rebranding.
- **Persistent Local DB** logic ready for cloud migration.
