# n8n AI Flow - Complete Setup Guide

## Current Status Analysis

### ✅ Working Components
- **Authentication System**: Working with demo credentials (demo@example.com / password123)
- **Dashboard UI**: Loads and displays properly
- **Navigation**: All main routes are accessible
- **Basic UI/UX**: Clean interface with good visual design

### ❌ Critical Issues Found

#### 1. **AI Workflow Generation Not Working**
- **Issue**: The AI chat interface doesn't respond to prompts
- **Root Cause**: Missing OpenAI/Anthropic API keys
- **Fix Required**: Configure valid API keys in environment variables

#### 2. **No Real n8n Integration**
- **Issue**: Workflows don't sync with actual n8n instance
- **Root Cause**: n8n server not configured/running
- **Fix Required**: Set up n8n instance and configure API connection

#### 3. **Database Not Connected**
- **Issue**: No data persistence, showing 0 workflows/executions
- **Root Cause**: Supabase connection not properly configured
- **Fix Required**: Set up Supabase project and configure credentials

#### 4. **Workflow Canvas Issues**
- **Issue**: Nodes don't connect properly, connections broken
- **Root Cause**: Handle ID mismatch (already fixed in code)
- **Status**: Fixed but needs testing

## Required Environment Variables

Create a `.env.local` file with these ACTUAL values:

```env
# Authentication (Working)
NEXTAUTH_URL=https://n8n-ai-flow-18bh0hd3j-unite-group.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here

# Database (REQUIRED - Currently Missing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services (REQUIRED - Currently Missing)
OPENAI_API_KEY=sk-your-actual-openai-key
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key

# n8n Integration (REQUIRED - Currently Missing)
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# Optional AI Services
GOOGLE_AI_API_KEY=your-google-ai-key
HUGGINGFACE_API_KEY=your-huggingface-key
```

## Setup Steps

### 1. Set Up Supabase
1. Create account at https://supabase.com
2. Create new project
3. Run the SQL migrations from `/supabase/migrations/`
4. Get your project URL and keys from Settings > API
5. Update `.env.local` with credentials

### 2. Configure AI Services
1. **OpenAI**: Get API key from https://platform.openai.com/api-keys
2. **Anthropic**: Get API key from https://console.anthropic.com/
3. Add keys to `.env.local`

### 3. Set Up n8n Instance
1. **Option A - Cloud**: Sign up at https://n8n.io/cloud/
2. **Option B - Self-hosted**:
   ```bash
   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -e N8N_BASIC_AUTH_ACTIVE=true \
     -e N8N_BASIC_AUTH_USER=admin \
     -e N8N_BASIC_AUTH_PASSWORD=password \
     -v ~/.n8n:/home/node/.n8n \
     n8nio/n8n
   ```
3. Get API key from n8n Settings > API
4. Update `.env.local` with n8n URL and API key

### 4. Deploy Updates
1. Push environment variables to Vercel:
   ```bash
   vercel env add OPENAI_API_KEY production
   vercel env add ANTHROPIC_API_KEY production
   vercel env add N8N_BASE_URL production
   vercel env add N8N_API_KEY production
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   ```

2. Redeploy:
   ```bash
   vercel --prod
   ```

## Testing Checklist

### Phase 1: Core Functionality
- [ ] AI responds to workflow generation prompts
- [ ] Workflow nodes appear on canvas
- [ ] Nodes connect properly with edges
- [ ] Save workflow persists to database
- [ ] Workflows list shows saved items

### Phase 2: n8n Integration
- [ ] Sync workflow to n8n
- [ ] Execute workflow from UI
- [ ] Monitor execution status
- [ ] View execution logs
- [ ] Handle webhook triggers

### Phase 3: Advanced Features
- [ ] File upload and processing
- [ ] Voice input transcription
- [ ] Template library works
- [ ] Multi-user collaboration
- [ ] Export/Import workflows

## Quick Fixes for Demo

If you need a quick demo without full setup:

1. **Mock AI Responses**: 
   - Enable demo mode in `/app/api/ai/generate-workflow/route.ts`
   - This will return pre-built workflow templates

2. **Local Storage Persistence**:
   - Already implemented as fallback
   - Works without Supabase

3. **Static Demo Data**:
   - Dashboard shows sample metrics
   - Pre-built workflow templates available

## Support Resources

- **n8n Documentation**: https://docs.n8n.io/
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Anthropic Claude**: https://docs.anthropic.com/

## Contact

For issues or questions:
- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)
- Email: support@your-domain.com