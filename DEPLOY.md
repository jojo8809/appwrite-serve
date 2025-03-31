# Deployment Guide for Happy Helper Hub

## Netlify Deployment Steps

1. **Push your code to GitHub**

2. **Connect Netlify to your GitHub repository**
   - Go to Netlify and sign in
   - Click "New site from Git"
   - Select GitHub and find your repository

3. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `build`

4. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add the following:
     - `MONGODB_URI`: `mongodb://netlify_app:Crazy8809@143.198.119.28:27017/happyhelper?authSource=admin`
     - `JWT_SECRET`: `abc123` (use a more secure value for production)

5. **Deploy**
   - Click "Deploy site"

## Digital Ocean MongoDB Setup Verification

- Ensure the MongoDB on DigitalOcean is properly configured to accept connections from outside
- Verify the `netlify_app` user has proper permissions
- The connection string format is correct: `mongodb://username:password@hostname:port/database?authSource=admin`

## Troubleshooting

If you encounter issues:

1. Check Netlify function logs in the Netlify dashboard under Functions
2. Verify MongoDB connection is working
3. Check for CORS issues if the frontend can't connect to the backend
