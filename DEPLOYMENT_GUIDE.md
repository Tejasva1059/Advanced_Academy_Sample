# 🚀 Production Deployment Guide: School Result Portal

This guide provides step-by-step instructions to deploy the **School Result Management System** for **Advanced Academy** to the cloud.

---

## 🌟 Recommended Setup (100% Free / Modern Cloud)

| Component | Recommended Platform | Plan | Key Features |
| :--- | :--- | :--- | :--- |
| **Frontend** (React / Vite) | **[Vercel](https://vercel.com)** or **[Netlify](https://netlify.com)** | Free | Global CDN, automatic HTTPS, continuous Git deployment |
| **Backend** (FastAPI) | **[Render.com](https://render.com)** or **[Railway.app](https://railway.app)** | Free / Hobby | Python 3.11+, automatic SSL, environment variables |
| **Database** | **SQLite (Default)** or **PostgreSQL (Render / Supabase)** | Free | Initialized and seeded automatically on first run |

---

## 🛠️ Option 1: Vercel (Frontend) + Render (Backend) [Recommended]

### Step 1: Deploy Backend on Render.com
1. Push your repository to **GitHub** or **GitLab**.
2. Go to **[Render.com](https://dashboard.render.com/)** and click **New + > Web Service**.
3. Connect your GitHub repository.
4. Set the following configuration:
   * **Name**: `advanced-academy-backend`
   * **Root Directory**: `backend`
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   * `APP_ENV`: `production`
   * `DEBUG`: `False`
   * `SECRET_KEY`: *(Generate a secure random string or use Render's generator)*
   * `CORS_ORIGINS`: `["*"]` *(or your Vercel URL once deployed)*
6. Click **Deploy Web Service**.
7. Copy your backend live URL (e.g. `https://advanced-academy-backend.onrender.com`).

---

### Step 2: Deploy Frontend on Vercel
1. Go to **[Vercel.com](https://vercel.com)** and log in with GitHub.
2. Click **Add New... > Project** and select your repository.
3. Configure the project:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   * **Name**: `VITE_API_URL`
   * **Value**: `https://advanced-academy-backend.onrender.com/api/v1` *(replace with your actual backend URL + `/api/v1`)*
5. Click **Deploy**.
6. Your school portal is now live with automatic SSL (e.g. `https://advanced-academy-portal.vercel.app`)!

---

## 🚂 Option 2: Railway.app (All-in-One: Frontend + Backend + Postgres)

1. Go to **[Railway.app](https://railway.app/)** and start a new project from GitHub.
2. **Add PostgreSQL Service** (Optional if using SQLite): Click **+ New > Database > PostgreSQL**.
3. **Add Backend Service**:
   * Root Directory: `/backend`
   * Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * Variable `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   * Variable `CORS_ORIGINS`: `["*"]`
4. **Add Frontend Service**:
   * Root Directory: `/frontend`
   * Build Command: `npm run build`
   * Variable `VITE_API_URL`: `https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api/v1`
5. Generate domains for both services.

---

## 🐳 Option 3: VPS / Docker Server (DigitalOcean, AWS EC2, Linode, Hetzner)

If deploying to your own Linux server / VPS using Docker:

1. Clone repository to server:
   ```bash
   git clone <your-repo-url> /opt/school-portal
   cd /opt/school-portal
   ```
2. Start the full stack with PostgreSQL, Backend, and Nginx frontend:
   ```bash
   docker compose up -d --build
   ```
3. Check status:
   ```bash
   docker compose ps
   ```
4. Access:
   * **Frontend**: `http://<your-server-ip>`
   * **Backend API**: `http://<your-server-ip>:8000/docs`

---

## 🔑 Default Login Credentials (Seeded On First Boot)

| Persona | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `AdminPassword123!` | Complete System Control (All 13 modules) |
| **Principal** | `principal` | `PrincipalPassword123!` | Academic Leadership (10 modules) |
| **Class Teacher (Class 5)** | `teacher5` | `TeacherPassword123!` | Classroom Focus (5 modules, Class 5th only) |
| **Class Teacher (Class 6)** | `teacher6` | `TeacherPassword123!` | Classroom Focus (5 modules, Class 6th only) |

---

## 📋 Environment Variables Reference

### Backend (`backend/.env`)
```ini
APP_NAME="ADVANCED ACADEMY School Result Portal"
APP_ENV=production
DEBUG=False
SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters
DATABASE_URL=sqlite:///./school.db  # or postgresql+psycopg://user:pass@host:5432/dbname
CORS_ORIGINS='["https://your-frontend-domain.vercel.app", "http://localhost:5173"]'
```

### Frontend (`frontend/.env.production`)
```ini
VITE_API_URL=https://your-backend-domain.onrender.com/api/v1
```
