# n8n AI Flow - Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
1. Vercel account
2. Supabase project
3. n8n instance (self-hosted or cloud)

### Environment Variables Setup

Configure the following environment variables in your Vercel project:

#### Required Variables

```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# n8n Configuration
N8N_API_URL=<your-n8n-instance-url>
N8N_API_KEY=<your-n8n-api-key>
N8N_WEBHOOK_URL=https://your-domain.vercel.app/api/webhooks/n8n
```

### Step-by-Step Deployment

1. **Generate NextAuth Secret**
   ```bash
   openssl rand -base64 32
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration script from `/supabase/migrations/`
   - Copy your project URL and keys

3. **Configure n8n**
   - Enable API in n8n settings
   - Generate an API key
   - Note your n8n instance URL

4. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

5. **Add Environment Variables**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all required variables
   - Redeploy for changes to take effect

### Database Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'inactive',
  n8n_workflow_id TEXT,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Users can view own workflows" ON workflows
  FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can create workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update own workflows" ON workflows
  FOR UPDATE USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete own workflows" ON workflows
  FOR DELETE USING (auth.uid()::TEXT = user_id::TEXT);
```

### Post-Deployment Checklist

- [ ] Verify authentication works
- [ ] Test Supabase connection
- [ ] Confirm n8n API connectivity
- [ ] Check workflow creation/execution
- [ ] Test webhook endpoints
- [ ] Verify environment variables are loaded

### Security Considerations

1. **API Keys**: Never commit API keys to git
2. **CORS**: Configure allowed origins in Vercel
3. **Rate Limiting**: Implement rate limiting for API routes
4. **SSL**: Ensure all connections use HTTPS
5. **RLS**: Keep Supabase RLS policies enabled

### Monitoring

- Use Vercel Analytics for performance monitoring
- Set up error tracking (e.g., Sentry)
- Monitor n8n execution logs
- Track Supabase usage and performance

### Support

For issues or questions:
- Check Vercel logs for deployment errors
- Review Supabase logs for database issues
- Verify n8n API is accessible
- Ensure all environment variables are set correctly