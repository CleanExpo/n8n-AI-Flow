# n8n AI Flow - Health Check & Monitoring Guide

## 🏥 System Health Dashboard

### Quick Status Check
Run these commands to verify system health:

```bash
# Check if development server is running
npm run dev

# Verify build process
npm run build

# Run linting checks
npm run lint

# Check TypeScript compilation
npx tsc --noEmit
```

## ✅ Critical Components Checklist

### 1. **Core Application**
- [ ] Next.js server starts without errors
- [ ] No console errors in browser
- [ ] All pages load correctly
- [ ] Navigation works between routes

### 2. **Authentication System**
- [ ] Sign in page loads
- [ ] Demo mode works (demo@example.com / password123)
- [ ] Session persistence works
- [ ] Protected routes redirect properly

### 3. **AI Workflow Generator**
- [ ] Chat interface accepts input
- [ ] Messages send without errors
- [ ] Workflow generation completes
- [ ] Generated workflows display correctly

### 4. **Workflow Canvas**
- [ ] React Flow renders without NaN errors
- [ ] Nodes can be dragged and positioned
- [ ] Connections between nodes work
- [ ] Canvas zoom and pan function properly

### 5. **Database & API**
- [ ] Supabase connection established
- [ ] API routes respond correctly
- [ ] Data persistence works
- [ ] Error handling returns proper messages

## 🔍 Common Issues & Solutions

### Issue: React Flow NaN Position Errors
**Symptoms:** Console shows "Expected number, MNaN,NaNhNaNvNaN..."
**Solution:** 
```javascript
// Ensure positions are objects, not arrays
position: { x: 250, y: 300 }  // ✅ Correct
position: [250, 300]           // ❌ Wrong
```

### Issue: AI Workflow Generator Not Responding
**Symptoms:** Send button doesn't work, no response
**Solution:**
1. Check console for API errors
2. Verify demo mode is enabled in `/api/ai/generate-workflow/route.ts`
3. Ensure button isn't disabled by state

### Issue: Glass Effect Makes UI Unreadable
**Symptoms:** Translucent backgrounds, hard to read text
**Solution:** Remove `backdrop-blur` and use solid backgrounds

### Issue: Missing Pages (404 Errors)
**Symptoms:** Navigation links lead to 404 pages
**Solution:** Create missing page components in `app/` directory

## 📊 Performance Metrics

### Target Metrics
- **Page Load Time:** < 3 seconds
- **API Response Time:** < 2 seconds
- **Bundle Size:** < 2MB
- **Lighthouse Score:** > 80

### Check Performance
```bash
# Build and analyze bundle
npm run build

# Check bundle size
npx next-bundle-analyzer

# Run Lighthouse audit (in browser DevTools)
```

## 🚀 Deployment Health

### Vercel Deployment Checklist
- [ ] Environment variables configured
- [ ] Build succeeds without warnings
- [ ] Preview deployments work
- [ ] Production URL accessible

### Required Environment Variables
```env
# Database
DATABASE_URL=
DIRECT_URL=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# n8n Integration
N8N_API_URL=
N8N_API_KEY=

# AI Services (Optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## 🔧 Maintenance Tasks

### Daily Checks
1. Monitor error logs in Vercel dashboard
2. Check API response times
3. Verify database connections

### Weekly Tasks
1. Review and clear old logs
2. Check for dependency updates
3. Run full test suite
4. Backup database

### Monthly Tasks
1. Security audit
2. Performance optimization review
3. Update documentation
4. Review user feedback

## 🐛 Debug Commands

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Find unused dependencies
npx depcheck

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities (if safe)
npm audit fix

# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📈 Monitoring Endpoints

### Health Check API
Create `/api/health` endpoint:
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    node: process.version,
  });
}
```

### Status Page Components
- Database connection status
- API endpoints availability
- External services (n8n, AI providers)
- Cache performance

## 🔄 Recovery Procedures

### If Development Server Crashes
```bash
# Kill all Node processes
pkill -f node

# Clear cache and restart
rm -rf .next
npm run dev
```

### If Build Fails
```bash
# Clear all caches
rm -rf .next node_modules package-lock.json

# Reinstall and rebuild
npm install
npm run build
```

### If Database Connection Fails
1. Check Supabase dashboard status
2. Verify environment variables
3. Test connection with Supabase client
4. Check network connectivity

## 📝 Logging & Monitoring

### Enable Debug Logging
```javascript
// Add to next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

### Monitor Key Metrics
- Response times for critical APIs
- Error rates by endpoint
- User session duration
- Workflow creation success rate

## 🎯 Success Criteria

The application is considered healthy when:
1. ✅ All pages load without errors
2. ✅ Authentication works properly
3. ✅ AI workflow generation succeeds
4. ✅ Workflow canvas renders correctly
5. ✅ No console errors in production
6. ✅ API response times < 2 seconds
7. ✅ Database queries execute successfully
8. ✅ Deployment pipeline is green

## 📞 Emergency Contacts

- **GitHub Repository:** https://github.com/CleanExpo/n8n-AI-Flow
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Error Tracking:** Check Vercel Functions logs

---

Last Updated: 2025-09-09
Version: 1.0.0