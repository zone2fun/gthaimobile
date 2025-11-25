# 🚀 Deploy Backend to Render - Step by Step Guide

## Prerequisites
- Backend code pushed to GitHub repository
- Render account (sign up at https://render.com)
- MongoDB Atlas database (or other MongoDB hosting)
- Cloudinary account

## 📝 Step 1: Prepare Backend for Deployment

### 1.1 Check package.json
Make sure your `backend/package.json` has these scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.2 Verify server.js
Ensure your server listens on the PORT environment variable:

```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 1.3 Check CORS configuration
Update CORS to allow your frontend domain:

```javascript
const cors = require('cors');

app.use(cors({
    origin: [
        'http://localhost:5173',  // Local development
        'https://your-frontend.vercel.app'  // Production (update after deploying frontend)
    ],
    credentials: true
}));
```

## 🌐 Step 2: Deploy to Render

### 2.1 Create New Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your **backend repository**

### 2.2 Configure Web Service

**Basic Settings:**
- **Name**: `gthai-backend` (or your preferred name)
- **Region**: Singapore (closest to Thailand)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (if backend is in root) or type `backend` if it's in a subfolder
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **"Free"** tier (or paid if needed)

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NODE_ENV=production
```

**Important Notes:**
- Get `MONGODB_URI` from MongoDB Atlas
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- Get Cloudinary credentials from your Cloudinary dashboard

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://gthai-backend.onrender.com`

## ✅ Step 3: Verify Deployment

### 3.1 Test API Endpoint
Open your browser or use curl:

```bash
curl https://your-backend-url.onrender.com/api/health
```

Or create a simple health check endpoint in your backend:

```javascript
// Add to server.js
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
});
```

### 3.2 Check Logs
- Go to Render Dashboard → Your Service → **"Logs"**
- Look for any errors or connection issues

## 🔧 Step 4: Update Frontend

### 4.1 Update Environment Variable
In your local `.env` file:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

### 4.2 Test Locally
```bash
npm run dev
```

Test if frontend can connect to deployed backend.

### 4.3 Deploy Frontend to Vercel
Once backend is working, deploy frontend and set environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-backend-url.onrender.com`
3. Redeploy frontend

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Solution**: Update CORS configuration in backend to include your Vercel URL

### Issue 2: MongoDB Connection Failed
**Solution**: 
- Check MongoDB Atlas → Network Access → Add `0.0.0.0/0` to whitelist
- Verify `MONGODB_URI` is correct

### Issue 3: Cloudinary Upload Failed
**Solution**: Double-check all Cloudinary environment variables

### Issue 4: 502 Bad Gateway
**Solution**: 
- Check Render logs for errors
- Ensure `PORT` environment variable is used correctly
- Verify all dependencies are in `package.json`

### Issue 5: Free Tier Sleep
**Note**: Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Consider using a cron job to ping every 10 minutes (or upgrade to paid tier)

## 📊 Monitoring

### Check Service Health
- Render Dashboard → Metrics
- Monitor CPU, Memory, and Response Time

### View Logs
- Real-time logs available in Render Dashboard
- Use for debugging production issues

## 🔄 Continuous Deployment

Render automatically redeploys when you push to GitHub:
1. Make changes to backend code
2. Commit and push to GitHub
3. Render automatically detects and redeploys

## 🎉 Done!

Your backend is now live at: `https://your-backend-url.onrender.com`

Remember to:
- ✅ Update frontend `VITE_API_URL`
- ✅ Update CORS to allow frontend domain
- ✅ Test all API endpoints
- ✅ Monitor logs for errors
