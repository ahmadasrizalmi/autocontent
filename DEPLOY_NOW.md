# 🚀 Deploy Autocontent to Vercel - Step by Step

## Quick Start (5 Minutes)

### Step 1: Open Vercel Dashboard
Go to: https://vercel.com/new

### Step 2: Import GitHub Repository
1. Click **"Import Git Repository"**
2. Select: `ahmadasrizalmi/autocontent`
3. Click **"Import"**

### Step 3: Configure Project

**Framework Preset:** Other (leave as is)

**Root Directory:** `./` (leave as is)

**Build Settings:**
- Build Command: `pnpm install && pnpm build`
- Output Directory: `client/dist`
- Install Command: `pnpm install`

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add these:

#### Database (Supabase)
```
DATABASE_URL
```
Value: `postgresql://postgres:[GET-FROM-SUPABASE]@db.pedjwxmpnkomimbfqgsy.supabase.co:5432/postgres`

**How to get password:**
1. Go to https://supabase.com/dashboard/project/pedjwxmpnkomimbfqgsy/settings/database
2. Copy database password
3. Replace `[GET-FROM-SUPABASE]` with actual password

```
SUPABASE_URL
```
Value: `https://pedjwxmpnkomimbfqgsy.supabase.co`

```
SUPABASE_ANON_KEY
```
Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZGp3eG1wbmtvbWltYmZxZ3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2Njg2NzAsImV4cCI6MjA3ODI0NDY3MH0.ZHbo91YelL3_kbvJCdY8huJWtb8sq_B_ZDpn0EG7XlE`

#### Gemini API
```
GEMINI_API_KEY
```
Value: `AIzaSyB73TfR1v-U42KB5ZkRqaLHJBc-tPxMGWw`

```
BUILT_IN_FORGE_API_URL
```
Value: `https://generativelanguage.googleapis.com`

```
BUILT_IN_FORGE_API_KEY
```
Value: `AIzaSyB73TfR1v-U42KB5ZkRqaLHJBc-tPxMGWw`

#### JWT & OAuth
```
JWT_SECRET
```
Value: `autocontent-super-secret-jwt-key-2025` (you can change this)

```
OAUTH_SERVER_URL
```
Value: Leave empty for now (will be filled after first deployment)

```
OWNER_OPEN_ID
```
Value: Leave empty for now

#### App Config
```
VITE_APP_ID
```
Value: `autocontent-production`

```
NODE_ENV
```
Value: `production`

### Step 5: Deploy!

Click **"Deploy"** button and wait 2-3 minutes.

### Step 6: Update OAuth URL (After First Deploy)

1. After deployment completes, copy your Vercel URL (e.g., `https://autocontent-xyz.vercel.app`)
2. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
3. Edit `OAUTH_SERVER_URL` and set it to your Vercel URL
4. Redeploy (Deployments tab > click "..." > Redeploy)

---

## ✅ Verification Checklist

After deployment:

- [ ] Homepage loads without errors
- [ ] AI Agents are visible on homepage
- [ ] Can navigate to `/videos` page
- [ ] Video Studio form is displayed
- [ ] AI Prompt Generator works
- [ ] Database connection is working

---

## 🎯 Quick Test

1. Visit your deployed URL
2. Click "Video Studio" button
3. Enable "AI Prompt Generator"
4. Select niche: "Foodie"
5. Enter topic: "making pasta"
6. Click "Generate Prompt"
7. Should see AI-generated prompt

---

## 🔧 Troubleshooting

### Build Fails

**Error:** "Command failed: pnpm build"

**Solution:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Try redeploying

### Database Connection Error

**Error:** "Connection refused" or "Authentication failed"

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check Supabase project is active
3. Ensure password is correct
4. Go to Supabase > Settings > Database > Connection pooling > Enable

### Gemini API Error

**Error:** "API key invalid"

**Solution:**
1. Verify `GEMINI_API_KEY` is correct
2. Check API key has proper permissions
3. Try regenerating API key in Google AI Studio

### 404 on Routes

**Error:** Page not found on `/videos`

**Solution:**
- Ensure `vercel.json` is in repository root
- Check rewrites configuration
- Redeploy

---

## 📊 Expected Deployment Time

- **Build Time:** 1-2 minutes
- **Deploy Time:** 30 seconds
- **Total:** ~2-3 minutes

---

## 🎉 Success!

Once deployed, you'll have:

✅ **Live URL** - Your app accessible worldwide  
✅ **Auto-deploy** - Every GitHub push triggers new deployment  
✅ **HTTPS** - Automatic SSL certificate  
✅ **CDN** - Fast global delivery  
✅ **Analytics** - Built-in Vercel analytics  

---

## 📱 Share Your App

Your app will be live at:
`https://autocontent-[random].vercel.app`

You can:
- Add custom domain later
- Share with team members
- Monitor usage in Vercel dashboard

---

## 🔐 Security Notes

After deployment:

1. **Change JWT_SECRET** to a strong random value
2. **Enable Supabase RLS** (Row Level Security)
3. **Set up rate limiting** for API endpoints
4. **Monitor API usage** to avoid unexpected costs
5. **Rotate API keys** regularly

---

## 📞 Need Help?

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Review `DEPLOYMENT_GUIDE.md` for detailed info
4. Check GitHub repository for updates

---

**Ready to deploy?** 🚀

Click here: https://vercel.com/new/import?repository-url=https://github.com/ahmadasrizalmi/autocontent

---

Last Updated: Nov 9, 2025  
Version: 1.0.0
