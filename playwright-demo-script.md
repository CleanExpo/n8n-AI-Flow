# n8n AI Flow - Comprehensive Demo Script
## Professional Automation Demonstration for Investors & Users

**Total Duration:** Under 2 minutes  
**Application URL:** http://localhost:3003  
**Demo Credentials:** demo@example.com / password123

---

## **SCENE 1: Landing Page Showcase** (0:00 - 0:15)

### Action 1: Navigate to Landing Page
```javascript
await page.goto('http://localhost:3003');
await page.waitForLoadState('networkidle');
```
- **Wait:** 2 seconds
- **Expected Result:** Professional landing page loads with modern gradient design
- **Feature Demonstrated:** First impression, professional UI/UX

### Action 2: Scroll Through Features
```javascript
await page.evaluate(() => {
    window.scrollTo({ top: 600, behavior: 'smooth' });
});
await page.waitForTimeout(1500);
```
- **Wait:** 1.5 seconds  
- **Expected Result:** Smooth scroll reveals feature cards with icons and descriptions
- **Feature Demonstrated:** 6 core features (Visual Builder, Real-time Execution, Data Persistence, etc.)

### Action 3: Highlight Key Statistics
```javascript
await page.evaluate(() => {
    document.querySelector('[class*="stats"]').scrollIntoView({ behavior: 'smooth' });
});
```
- **Wait:** 1 second
- **Expected Result:** Shows impressive stats: "40+ Node Types", "100% Open Source", "24/7 Automation"
- **Feature Demonstrated:** Platform capabilities and credibility

---

## **SCENE 2: Authentication Experience** (0:15 - 0:25)

### Action 4: Navigate to Sign In
```javascript
await page.click('button:has-text("Sign In")');
await page.waitForURL('**/auth/signin');
```
- **Wait:** 1 second
- **Expected Result:** Clean, professional sign-in form loads
- **Feature Demonstrated:** Secure authentication system

### Action 5: Enter Demo Credentials
```javascript
await page.fill('input[type="email"]', 'demo@example.com');
await page.fill('input[type="password"]', 'password123');
await page.click('button[type="submit"]');
```
- **Wait:** 2 seconds
- **Expected Result:** Smooth sign-in animation, redirect to dashboard
- **Feature Demonstrated:** User authentication with NextAuth.js

---

## **SCENE 3: Dashboard Overview** (0:25 - 0:40)

### Action 6: Dashboard Tour
```javascript
await page.waitForURL('**/dashboard');
await page.waitForSelector('[class*="welcome"]');
```
- **Wait:** 1 second
- **Expected Result:** Personalized welcome message and comprehensive dashboard
- **Feature Demonstrated:** User experience, dashboard analytics

### Action 7: Highlight AI Workflow Banner
```javascript
await page.evaluate(() => {
    document.querySelector('[class*="gradient-to-r from-purple-600"]').scrollIntoView({ behavior: 'smooth' });
});
```
- **Wait:** 1.5 seconds
- **Expected Result:** Prominent AI Workflow Generator banner with sparkles animation
- **Feature Demonstrated:** AI-powered automation capabilities

### Action 8: Show Statistics Cards
```javascript
await page.evaluate(() => {
    document.querySelector('[class*="stats-grid"]').scrollIntoView({ behavior: 'smooth' });
});
```
- **Wait:** 1 second
- **Expected Result:** Live statistics showing workflows, executions, success rates
- **Feature Demonstrated:** Real-time monitoring and analytics

---

## **SCENE 4: AI Workflow Generator** (0:40 - 1:30)

### Action 9: Access AI Generator
```javascript
await page.click('a[href="/ai-workflow"]');
await page.waitForURL('**/ai-workflow');
```
- **Wait:** 1 second
- **Expected Result:** AI Workflow Generator interface loads with chat and canvas tabs
- **Feature Demonstrated:** Core AI functionality

### Action 10: Natural Language Input
```javascript
await page.fill('[placeholder*="describe"]', 'Create a workflow that monitors my Gmail inbox for emails with "urgent" in the subject and sends them to a Slack channel #alerts');
await page.press('[placeholder*="describe"]', 'Enter');
```
- **Wait:** 3 seconds
- **Expected Result:** AI processes the request and generates workflow nodes
- **Feature Demonstrated:** Natural language processing, AI understanding

### Action 11: Show Generated Workflow
```javascript
await page.click('button:has-text("Canvas")');
await page.waitForSelector('[class*="workflow-canvas"]');
```
- **Wait:** 2 seconds
- **Expected Result:** Visual workflow canvas displays with Gmail → Filter → Slack nodes connected
- **Feature Demonstrated:** Visual workflow builder, node connections

### Action 12: Workflow Interaction
```javascript
// Hover over nodes to show details
await page.hover('[data-node-id*="gmail"]');
await page.waitForTimeout(1000);
await page.hover('[data-node-id*="slack"]');
```
- **Wait:** 2 seconds total
- **Expected Result:** Node tooltips show configuration options and parameters
- **Feature Demonstrated:** Interactive canvas, node configuration

---

## **SCENE 5: Advanced Features Demo** (1:30 - 1:50)

### Action 13: Try Demo Mode
```javascript
await page.click('button:has-text("Start Demo")');
await page.waitForSelector('[class*="demo-center"]');
```
- **Wait:** 1 second
- **Expected Result:** Demo center modal opens with multiple scenarios
- **Feature Demonstrated:** Built-in demo system, multiple use cases

### Action 14: Select Advanced Scenario
```javascript
await page.click('[data-scenario="api-integration"]');
```
- **Wait:** 1 second
- **Expected Result:** Complex API integration scenario loads with multiple nodes
- **Feature Demonstrated:** Advanced automation capabilities

### Action 15: Show Deployment Options
```javascript
await page.click('button:has-text("Deploy to n8n")');
```
- **Wait:** 1 second
- **Expected Result:** Deployment confirmation dialog appears
- **Feature Demonstrated:** One-click deployment to n8n engine

---

## **SCENE 6: Professional Features** (1:50 - 2:00)

### Action 16: Navigate to Workflows
```javascript
await page.click('a[href="/workflows"]');
await page.waitForURL('**/workflows');
```
- **Wait:** 1 second
- **Expected Result:** Workflow management interface with saved workflows
- **Feature Demonstrated:** Workflow management, persistence

### Action 17: Show Execution History
```javascript
await page.click('a[href="/executions"]');
await page.waitForURL('**/executions');
```
- **Wait:** 1 second
- **Expected Result:** Detailed execution logs and monitoring
- **Feature Demonstrated:** Enterprise monitoring, logging

### Action 18: Final Overview
```javascript
await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
```
- **Wait:** 1 second
- **Expected Result:** Return to top showing complete application overview
- **Feature Demonstrated:** Complete platform capabilities

---

## **Complete Playwright Test Script**

```javascript
const { test, expect } = require('@playwright/test');

test('n8n AI Flow - Complete Demo', async ({ page }) => {
  // Set viewport for recording
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Scene 1: Landing Page
  console.log('🎬 Scene 1: Landing Page Showcase');
  await page.goto('http://localhost:3003');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }));
  await page.waitForTimeout(1500);
  
  // Scene 2: Authentication
  console.log('🎬 Scene 2: Authentication Experience');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/auth/signin');
  await page.waitForTimeout(1000);
  
  await page.fill('input[type="email"]', 'demo@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Scene 3: Dashboard
  console.log('🎬 Scene 3: Dashboard Overview');
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    const banner = document.querySelector('[class*="gradient-to-r from-purple-600"]');
    if (banner) banner.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);
  
  // Scene 4: AI Workflow Generator
  console.log('🎬 Scene 4: AI Workflow Generator');
  await page.click('a[href="/ai-workflow"]');
  await page.waitForURL('**/ai-workflow');
  await page.waitForTimeout(1000);
  
  const chatInput = 'Create a workflow that monitors my Gmail inbox for emails with "urgent" in the subject and sends them to a Slack channel #alerts';
  await page.fill('textarea, input[type="text"]', chatInput);
  await page.press('textarea, input[type="text"]', 'Enter');
  await page.waitForTimeout(3000);
  
  // Switch to canvas if available
  const canvasTab = page.locator('button:has-text("Canvas")');
  if (await canvasTab.isVisible()) {
    await canvasTab.click();
    await page.waitForTimeout(2000);
  }
  
  // Scene 5: Advanced Features
  console.log('🎬 Scene 5: Advanced Features Demo');
  const demoButton = page.locator('button:has-text("Demo"), button:has-text("Start Demo")');
  if (await demoButton.first().isVisible()) {
    await demoButton.first().click();
    await page.waitForTimeout(1000);
  }
  
  // Scene 6: Professional Features
  console.log('🎬 Scene 6: Professional Features');
  await page.goto('http://localhost:3003/dashboard');
  await page.waitForTimeout(1000);
  
  console.log('✅ Demo completed successfully!');
});
```

---

## **Key Features Demonstrated**

### 🎨 **Visual & UX Excellence**
- Modern gradient design and animations
- Responsive layout and smooth transitions
- Professional typography and iconography
- Intuitive navigation and user flow

### 🤖 **AI-Powered Automation**
- Natural language workflow generation
- Intelligent node suggestion and connection
- Context-aware parameter configuration
- Multi-modal input (text, voice, files)

### ⚡ **Technical Capabilities**
- Real-time workflow execution
- Visual node-based workflow builder
- Secure authentication with NextAuth.js
- PostgreSQL data persistence with Supabase

### 🔧 **Enterprise Features**
- Comprehensive workflow management
- Detailed execution monitoring and logging
- One-click deployment to n8n engine
- Row-level security and API key management

### 📊 **Analytics & Monitoring**
- Live dashboard with key metrics
- Execution history and success rates
- Performance monitoring and alerts
- User activity tracking

---

## **Recording Tips**

1. **Use 1920x1080 resolution** for crisp recording quality
2. **Smooth cursor movements** - avoid jerky motions
3. **Highlight key elements** with gentle hovers
4. **Wait for animations** to complete before proceeding
5. **Show success states** - green checkmarks, success messages
6. **Demonstrate responsiveness** - resize browser briefly
7. **End with dashboard overview** showing complete capabilities

---

## **Narration Script** (Optional Voice-Over)

> "Welcome to n8n AI Flow - the next generation of workflow automation. In under two minutes, watch how anyone can create powerful automation workflows using nothing but natural language.
>
> Starting with our professional landing page, you can see the modern interface and comprehensive feature set. With over 40 node types and 100% open source technology, n8n AI Flow makes automation accessible to everyone.
>
> Authentication is seamless and secure, powered by NextAuth.js. Once logged in, users see a comprehensive dashboard with real-time analytics and their workflow portfolio.
>
> The magic happens in our AI Workflow Generator. Simply describe what you want to automate in plain English - like 'monitor Gmail for urgent emails and send them to Slack' - and watch as our AI creates a complete workflow with proper node connections and configurations.
>
> The visual workflow canvas lets users fine-tune their automation with drag-and-drop simplicity. When ready, one-click deployment pushes the workflow directly to n8n for immediate execution.
>
> With enterprise features like detailed monitoring, execution history, and secure data handling, n8n AI Flow bridges the gap between no-code simplicity and enterprise-grade automation."

---

**This demonstration showcases a professional, investor-ready application that combines cutting-edge AI with proven automation technology, delivering real business value through an exceptional user experience.**