# 🧠 KnowBase AI — AI Knowledge Assistant SaaS Platform

> *"ChatGPT for your personal documents"* — Upload PDFs, chat with AI, get cited answers.

## 🚀 Quick Start (5 minutes)

### Step 1 — Prerequisites
- **Python 3.13** (run `py --list` to check — use `python3.13`)
- **Node.js 18+** (`node --version`)
- Free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (M0 free tier)
- Free [Gemini API Key](https://aistudio.google.com/app/apikey) (1500 req/day free)

### Step 2 — Configure Environment
Run the interactive setup wizard:
```powershell
.\setup-env.ps1
```
This creates `backend\.env` with your MongoDB URI, Gemini API key, and a random JWT secret.

Or create `backend\.env` manually:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=ai_knowledge_assistant
JWT_SECRET=your-random-secret-here
GEMINI_API_KEY=your-gemini-key-here
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:5173
```

### Step 3 — Install Dependencies (first time only)
```powershell
# Backend (Python 3.13 venv)
cd backend
python3.13 -m venv venv        # recreate if using old Python
.\venv\Scripts\pip install pymupdf
.\venv\Scripts\pip install -r requirements.txt

# Frontend
cd ..\frontend
npm install
```

### Step 4 — Launch Everything
```powershell
# From the project root:
.\start.ps1
```

The script will:
- ✅ Check for your `.env` file
- 🚀 Start FastAPI backend at `http://localhost:8000`
- ⚛️  Start React frontend at `http://localhost:5173`
- 🌐 Open your browser automatically

> **First launch note:** The AI embedding model (`all-MiniLM-L6-v2`, ~90MB) downloads automatically the first time. Server startup takes ~30 seconds.

---

## 🧠 System Architecture

```
React Frontend (Vite + React 18)
       ↓  JWT Auth
FastAPI Backend (Python 3.13)
       ├── MongoDB Atlas ── users, documents, chat history
       ├── FAISS (local) ── per-user vector embeddings
       └── sentence-transformers ── free local embedding model
                   ↓
       Gemini 1.5 Flash ── LLM for answers
```

## 💰 Cost Breakdown — $0

| Service | Tier | Limit |
|---------|------|-------|
| MongoDB Atlas | Free M0 | 512 MB storage |
| Gemini 1.5 Flash | Free | 1,500 req/day |
| sentence-transformers | Local | Unlimited |
| FAISS | Local | Unlimited |
| Vercel (frontend deploy) | Free | Unlimited |
| Render (backend deploy) | Free | 512 MB RAM |

---

## 📁 Project Structure

```
ai-knowledge-assistant/
├── backend/                      FastAPI Python backend
│   ├── main.py                   App entry point + CORS
│   ├── database.py               MongoDB connection (Motor async)
│   ├── requirements.txt          Python dependencies
│   ├── .env                      🔑 Your secrets (create via setup-env.ps1)
│   ├── models/
│   │   ├── user.py               User Pydantic schemas
│   │   ├── document.py           Document schemas
│   │   └── chat.py               Chat request schemas
│   ├── routers/
│   │   ├── auth.py               /api/auth/* (JWT signup/login/me)
│   │   ├── documents.py          /api/documents/* (upload/list/delete)
│   │   ├── chat.py               /api/chat/* (RAG chat + history)
│   │   └── dashboard.py          /api/dashboard/stats
│   └── services/
│       ├── pdf_parser.py         PyMuPDF + LangChain text splitter
│       ├── vectorstore.py        FAISS per-user index management
│       ├── llm.py                Gemini 1.5 Flash wrapper
│       └── rag.py                Full RAG pipeline
├── frontend/                     React 18 + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx       Home page (animated particles)
│   │   │   ├── Login.jsx         JWT login
│   │   │   ├── Signup.jsx        Registration
│   │   │   ├── Dashboard.jsx     Stats + charts (Recharts)
│   │   │   ├── Documents.jsx     Upload + manage PDFs
│   │   │   ├── Chat.jsx          RAG chatbot UI
│   │   │   └── Profile.jsx       Account + plan management
│   │   ├── components/
│   │   │   └── Sidebar.jsx       App navigation sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx   JWT auth state (React Context)
│   │   ├── api/
│   │   │   └── client.js         Axios + JWT interceptors
│   │   └── index.css             Design system (600+ lines)
│   └── vite.config.js            Vite + API proxy config
├── setup-env.ps1                 🔑 Interactive .env setup wizard
└── start.ps1                     One-click launcher
```

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Current user profile |
| PATCH | `/api/auth/me` | ✅ | Update display name |
| PATCH | `/api/auth/me/plan` | ✅ | Toggle Free/Pro (demo) |
| POST | `/api/documents/upload` | ✅ | Upload PDF |
| GET | `/api/documents/` | ✅ | List documents |
| DELETE | `/api/documents/{id}` | ✅ | Delete document |
| GET | `/api/documents/{id}/status` | ✅ | Check processing status |
| POST | `/api/chat/` | ✅ | Send message (RAG answer) |
| GET | `/api/chat/history` | ✅ | Fetch chat history |
| DELETE | `/api/chat/history` | ✅ | Clear history |
| GET | `/api/dashboard/stats` | ✅ | Analytics data |

## 💰 Plan Limits

| Feature | Free | Pro |
|---------|------|-----|
| Documents | 5 | Unlimited |
| Queries/day | 20 | Unlimited |
| File size | 10 MB | 50 MB |
| Chat history | 7 days | Lifetime |

## 🔥 Key Features

- **RAG Pipeline** — FAISS similarity search → Gemini 1.5 Flash → cited answer
- **Voice Input** — Web Speech API, no extra setup
- **PDF Export** — Full chat as formatted PDF (jsPDF)
- **Real-time Processing** — Upload polls every 4s for `processing → ready`
- **Multi-document chat** — Filter chat to one or all documents
- **Source citations** — Every answer shows document + page number
- **Mobile responsive** — Full sidebar hamburger menu
- **Dark glassmorphism UI** — Purple/cyan gradient, Inter font

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 5, Recharts, jsPDF, react-dropzone |
| Backend | FastAPI 0.136+, Motor (async MongoDB) |
| Auth | JWT (python-jose + bcrypt/passlib) |
| AI/RAG | LangChain, FAISS, sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Google Gemini 1.5 Flash (free tier) |
| Database | MongoDB Atlas (free M0) |
| Python | 3.13 (required — 3.14 has package compatibility issues) |
