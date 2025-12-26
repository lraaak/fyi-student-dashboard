# Complete Deployment Guide - FYI Dashboard

Deploy your full-stack app to production for free!

## Prerequisites

- GitHub account
- Railway account (sign up at railway.app)
- Vercel account (sign up at vercel.com)

---

## Part 1: Deploy Backend to Railway (15 minutes)

### Step 1: Prepare Backend for Deployment

**1.1 Update requirements.txt**
Make sure `backend/requirements.txt` has all dependencies:
```
fastapi
uvicorn
mysql-connector-python
pandas
scikit-learn
python-jose[cryptography]
bcrypt
python-multipart
```

**1.2 Create Procfile**
Create `backend/Procfile` (no extension):
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**1.3 Update CORS in main.py**
Change the CORS origins to allow your future Vercel domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your Vercel URL after deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 2: Push to GitHub

```bash
cd "C:\Users\mtd28\Desktop\RESUME PROJECTS\TRACKER"

# If not already initialized
git init
git add .
git commit -m "Prepare for deployment"

# Create GitHub repo and push
# Go to github.com/new, create repo "fyi-dashboard"
git remote add origin https://github.com/YOUR_USERNAME/fyi-dashboard.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select your `fyi-dashboard` repository
5. Railway will detect it's a Python app

**3.1 Add MySQL Database**
1. In your Railway project, click "+ New"
2. Select "Database" → "MySQL"
3. Railway creates a MySQL instance automatically

**3.2 Configure Environment Variables**
1. Click on your backend service
2. Go to "Variables" tab
3. Add these variables (Railway auto-provides DB credentials):
   - `DB_HOST` = `${{MySQL.MYSQL_HOST}}`
   - `DB_USER` = `${{MySQL.MYSQL_USER}}`
   - `DB_PASSWORD` = `${{MySQL.MYSQL_PASSWORD}}`
   - `DB_NAME` = `${{MySQL.MYSQL_DATABASE}}`
   - `SECRET_KEY` = (generate with: `openssl rand -hex 32`)

**3.3 Update main.py to use environment variables**
Replace hardcoded credentials:
```python
import os

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "YOUR_PASSWORD_HERE")
DB_NAME = os.getenv("DB_NAME", "dlsu_productivity_db")
```

**3.4 Run Migration**
1. Click on MySQL service in Railway
2. Click "Connect" → "MySQL CLI"
3. Paste your migration SQL and run it

**3.5 Get Backend URL**
1. Click "Settings" on your backend service
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://your-app.railway.app`)

---

## Part 2: Deploy Frontend to Vercel (10 minutes)

### Step 1: Update API URL

**1.1 Update api.js**
Change `baseURL` to your Railway backend URL:
```javascript
const api = axios.create({
    baseURL: 'https://your-app.railway.app',  // Your Railway URL
});
```

**1.2 Update AuthContext.jsx**
Change the fetch URLs:
```javascript
const response = await fetch('https://your-app.railway.app/login', {
    // ...
});
```

### Step 2: Commit Changes

```bash
git add .
git commit -m "Update API URLs for production"
git push
```

### Step 3: Deploy to Vercel

**Option A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: fyi-dashboard
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist

# Deploy to production
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click "Deploy"

### Step 4: Update CORS

Go back to Railway:
1. Update `main.py` CORS to use your Vercel URL:
```python
allow_origins=["https://your-app.vercel.app"],
```
2. Commit and push - Railway auto-deploys

---

## Part 3: Testing

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Register a new account
3. Add tasks
4. Test predictions
5. Verify data persists after refresh

---

## Part 4: Custom Domain (Optional)

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Railway:
1. Go to Service Settings → Networking
2. Add custom domain
3. Update DNS records

---

## Troubleshooting

**Backend won't start:**
- Check Railway logs
- Verify environment variables
- Ensure Procfile is correct

**Frontend can't connect:**
- Check CORS settings
- Verify API URL in api.js
- Check browser console for errors

**Database connection fails:**
- Verify Railway MySQL is running
- Check environment variables
- Run migration script

---

## Costs

- **Railway**: Free tier (500 hours/month, $5 credit)
- **Vercel**: Free tier (unlimited hobby projects)
- **Total**: $0/month for hobby use

---

## Next Steps

1. Set up custom domain
2. Add email verification
3. Implement password reset
4. Add analytics (Vercel Analytics)
5. Set up monitoring (Railway metrics)
