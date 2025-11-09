# Deployment Guide - Autocontent to Vercel

## Prerequisites

- Vercel account
- GitHub repository connected
- Supabase project setup (already done: `pedjwxmpnkomimbfqgsy`)
- Gemini API key (already provided)

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Deploy to Vercel

From the project root directory:

```bash
cd /home/ubuntu/autocontent
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Select your account**
- Link to existing project? **No**
- Project name? **autocontent** (or your preferred name)
- Directory? **./** (current directory)
- Override settings? **No**

## Step 4: Configure Environment Variables in Vercel

After deployment, add these environment variables in Vercel Dashboard:

### Database
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.pedjwxmpnkomimbfqgsy.supabase.co:5432/postgres
```

### Supabase
```
SUPABASE_URL=https://pedjwxmpnkomimbfqgsy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZGp3eG1wbmtvbWltYmZxZ3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2Njg2NzAsImV4cCI6MjA3ODI0NDY3MH0.ZHbo91YelL3_kbvJCdY8huJWtb8sq_B_ZDpn0EG7XlE
```

### JWT & OAuth
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OAUTH_SERVER_URL=https://your-app.vercel.app
OWNER_OPEN_ID=owner-open-id
```

### App Configuration
```
VITE_APP_ID=autocontent-production
NODE_ENV=production
```

### Gemini API
```
GEMINI_API_KEY=AIzaSyB73TfR1v-U42KB5ZkRqaLHJBc-tPxMGWw
BUILT_IN_FORGE_API_URL=https://generativelanguage.googleapis.com
BUILT_IN_FORGE_API_KEY=AIzaSyB73TfR1v-U42KB5ZkRqaLHJBc-tPxMGWw
```

## Step 5: Get Supabase Database Password

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `pedjwxmpnkomimbfqgsy`
3. Go to Settings > Database
4. Copy the database password
5. Update `DATABASE_URL` in Vercel with the actual password

## Step 6: Redeploy

After adding environment variables:

```bash
vercel --prod
```

## Alternative: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository: `ahmadasrizalmi/autocontent`
3. Configure project:
   - Framework Preset: **Other**
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `client/dist`
   - Install Command: `pnpm install`
4. Add all environment variables from Step 4
5. Click **Deploy**

## Post-Deployment

### Verify Database Connection

Visit your deployed app and check:
- Homepage loads correctly
- AI agents are visible
- Database connection is working

### Test Video Generation

1. Navigate to `/videos`
2. Enable AI Prompt Generator
3. Select a niche (e.g., "Foodie")
4. Generate a prompt
5. Generate a video

### Monitor Logs

```bash
vercel logs
```

Or check logs in Vercel Dashboard.

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify `DATABASE_URL` is correct
2. Check Supabase project is active
3. Ensure IP allowlist includes Vercel IPs (or set to allow all)

### Build Failures

If build fails:

1. Check build logs in Vercel
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles without errors: `pnpm check`

### API Key Issues

If Gemini API fails:

1. Verify API key is correct
2. Check API key has proper permissions
3. Monitor API usage quotas

## Database Schema

Tables are already created in Supabase:
- `users` - User authentication
- `posts` - Generated content
- `jobs` - Content creation tracking
- `agents` - AI agent monitoring
- `videos` - Video generation records

## Scaling Considerations

### For Production Use

1. **Database**: Upgrade Supabase plan for better performance
2. **API Limits**: Monitor Gemini API usage
3. **Caching**: Implement Redis for session management
4. **CDN**: Use Vercel Edge Network for static assets
5. **Monitoring**: Set up error tracking (Sentry, LogRocket)

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set proper CORS origins
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Rotate API keys regularly
- [ ] Set up rate limiting
- [ ] Enable HTTPS only

## Maintenance

### Regular Tasks

- Monitor API usage and costs
- Check error logs weekly
- Update dependencies monthly
- Backup database regularly
- Review security advisories

### Updating the App

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin master

# Vercel auto-deploys from GitHub
```

## Support

For issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check Gemini API status
4. Refer to documentation files in the repo

## Resources

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Gemini API Docs: https://ai.google.dev/gemini-api/docs
- GitHub Repo: https://github.com/ahmadasrizalmi/autocontent

---

**Deployment Status:** Ready to deploy
**Last Updated:** Nov 9, 2025
**Version:** 1.0.0
