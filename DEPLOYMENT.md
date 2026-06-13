# Deployment Guide

This guide walks you through deploying the Inventory Management System on free hosting platforms.

## Recommended Stack (100% Free Tier)

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| PostgreSQL | [Neon](https://neon.tech) | 0.5 GB storage |
| Backend API | [Render](https://render.com) | 750 hrs/month |
| Frontend | [Vercel](https://vercel.com) | Unlimited static sites |
| Docker Images | [Docker Hub](https://hub.docker.com) | 1 private repo free |
| Source Code | [GitHub](https://github.com) | Free |

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Inventory & Order Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-management.git
git push -u origin main
```

---

## Step 2: Set Up PostgreSQL (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project named `inventory-db`
3. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this — you'll need it for the backend

---

## Step 3: Deploy Backend (Render)

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `inventory-api`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Instance Type**: Free
5. Add Environment Variables:
   ```
   DATABASE_URL = <your-neon-connection-string>
   CORS_ORIGINS = https://your-frontend.vercel.app,http://localhost:5173
   DEBUG = false
   ```
6. Click **Create Web Service**
7. Wait for deployment — note your URL: `https://inventory-api.onrender.com`

> **Note**: Render free tier spins down after 15 min inactivity. First request may take ~30s to wake up.

### Alternative: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → select repo
3. Add PostgreSQL plugin (provides `DATABASE_URL` automatically)
4. Set root directory to `backend`, use Dockerfile
5. Add `CORS_ORIGINS` env var with your frontend URL

---

## Step 4: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New → Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL = https://inventory-api.onrender.com
   ```
6. Click **Deploy**
7. Note your URL: `https://your-project.vercel.app`

### Update Backend CORS

Go back to Render and update `CORS_ORIGINS` to include your Vercel URL:
```
CORS_ORIGINS = https://your-project.vercel.app,http://localhost:5173
```

---

## Step 5: Push Docker Images to Docker Hub

```bash
# Login to Docker Hub
docker login

# Build images
docker compose build

# Tag images
docker tag inventory-managemnet-backend YOUR_DOCKERHUB/inventory-backend:latest
docker tag inventory-managemnet-frontend YOUR_DOCKERHUB/inventory-frontend:latest

# Push images
docker push YOUR_DOCKERHUB/inventory-backend:latest
docker push YOUR_DOCKERHUB/inventory-frontend:latest
```

Your Docker Hub links:
- `https://hub.docker.com/r/YOUR_DOCKERHUB/inventory-backend`
- `https://hub.docker.com/r/YOUR_DOCKERHUB/inventory-frontend`

---

## Step 6: Verify Deployment

1. **Backend Health**: Visit `https://your-api.onrender.com/health`
   - Should return: `{"status": "healthy", ...}`

2. **API Docs**: Visit `https://your-api.onrender.com/docs`
   - Interactive Swagger UI should load

3. **Frontend**: Visit your Vercel URL
   - Dashboard should show stats
   - Try creating a product, customer, and order

4. **Business Rules Test**:
   - Create a product with stock = 2
   - Try ordering 5 units → should fail with "Insufficient stock"
   - Order 2 units → should succeed, stock becomes 0
   - Try duplicate SKU → should fail with 409 Conflict
   - Try duplicate email → should fail with 409 Conflict

---

## Submission Checklist

- [ ] GitHub repository link (public)
- [ ] Docker Hub image links (backend + frontend)
- [ ] Live frontend URL
- [ ] Live backend API URL
- [ ] README with setup instructions
- [ ] All business rules working
- [ ] Docker Compose runs locally

---

## Troubleshooting

### Backend won't start on Render
- Check logs in Render dashboard
- Verify `DATABASE_URL` is correct and includes `?sslmode=require` for Neon
- Ensure Dockerfile is in the `backend/` directory

### Frontend shows "Failed to fetch"
- Verify `VITE_API_URL` is set correctly in Vercel
- Check CORS_ORIGINS includes your Vercel domain
- Backend may be sleeping (Render free tier) — wait 30s and retry

### Database connection errors
- Neon connection strings need `?sslmode=require` appended
- Format: `postgresql://user:pass@host/db?sslmode=require`

### CORS errors
- Backend `CORS_ORIGINS` must exactly match frontend URL (no trailing slash)
- Include both production and localhost URLs
