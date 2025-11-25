# Environment Variables Configuration

## Development
Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

## Environment Variables

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (e.g., `http://localhost:5000` for local, or your deployed backend URL)

### Backend (backend/.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## Deployment

### Frontend (Vercel)
Set environment variable in Vercel dashboard:
- `VITE_API_URL` = Your deployed backend URL (e.g., `https://your-backend.onrender.com`)

### Backend (Render/Railway)
Set all backend environment variables in your hosting platform dashboard.
