# 🚀 Deploy Frontend to Vercel - Step by Step Guide

## Prerequisites
- Frontend code pushed to GitHub
- Vercel account (sign up at https://vercel.com)
- Backend deployed and URL ready

## 📝 Step 1: Prepare Frontend

### 1.1 Verify Build Configuration
Make sure your `package.json` has build script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.2 Test Build Locally
```bash
npm run build
npm run preview
```

Make sure there are no build errors.

## 🌐 Step 2: Deploy to Vercel

### 2.1 Import Project
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (frontend)
4. Click **"Import"**

### 2.2 Configure Project

**Framework Preset**: Vite (auto-detected)

**Build Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 Add Environment Variables

Click **"Environment Variables"** and add:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

**Important**: Replace with your actual Render backend URL

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll get a URL like: `https://your-app.vercel.app`

## ✅ Step 3: Update Backend CORS

### 3.1 Add Frontend URL to Backend
Go to your backend code and update CORS:

```javascript
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://your-app.vercel.app'  // Add your Vercel URL here
    ],
    credentials: true
}));
```

### 3.2 Redeploy Backend
Push changes to GitHub, Render will auto-deploy.

## 🔧 Step 4: Test Production

### 4.1 Open Your App
Visit: `https://your-app.vercel.app`

### 4.2 Test Features
- ✅ Login/Register
- ✅ Create Post
- ✅ Upload Images
- ✅ Real-time notifications (Socket.IO)
- ✅ Search functionality

## 🐛 Troubleshooting

### Issue 1: API Connection Failed
**Check:**
- Is `VITE_API_URL` set correctly in Vercel?
- Is backend running on Render?
- Check browser console for CORS errors

**Solution:**
- Verify environment variable in Vercel Settings
- Update backend CORS configuration

### Issue 2: Images Not Loading
**Check:**
- Cloudinary credentials in backend
- Network tab in browser DevTools

### Issue 3: Socket.IO Not Connecting
**Check:**
- Backend logs on Render
- Socket.IO URL in SocketContext.jsx

**Solution:**
- Ensure backend supports WebSocket
- Check firewall/proxy settings

## 🔄 Continuous Deployment

Vercel automatically redeploys on Git push:
1. Make changes to frontend
2. Commit and push to GitHub
3. Vercel auto-deploys (1-2 minutes)

## 📊 Monitoring

### Vercel Dashboard
- View deployment status
- Check build logs
- Monitor performance

### Analytics (Optional)
Enable Vercel Analytics for:
- Page views
- Performance metrics
- User insights

## 🎉 Done!

Your app is now live at: `https://your-app.vercel.app`

### Final Checklist:
- ✅ Frontend deployed to Vercel
- ✅ Backend deployed to Render
- ✅ Environment variables configured
- ✅ CORS updated
- ✅ All features tested
- ✅ Custom domain (optional)

## 🌟 Optional: Custom Domain

### Add Custom Domain
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `myapp.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

Enjoy your deployed app! 🚀
