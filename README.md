# n8n AI Flow 🚀

> Revolutionary AI-powered workflow automation platform that creates n8n workflows from natural language, documents, images, and voice commands.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue)](https://n8n-ai-flow-9y2k2zhki-unite-group.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/CleanExpo/n8n-AI-Flow)
[![Built with](https://img.shields.io/badge/Built%20with-Next.js%2014-black)](https://nextjs.org)
[![AI Powered](https://img.shields.io/badge/AI-GPT--4%20%26%20Whisper-green)](https://openai.com)

## 🌐 Live Demo

**Visit the application**: [https://n8n-ai-flow-9y2k2zhki-unite-group.vercel.app](https://n8n-ai-flow-9y2k2zhki-unite-group.vercel.app)

## ✨ Key Features

### 🤖 AI-Powered Workflow Generation
- **Natural Language Processing**: Describe your workflow in plain English
- **Multi-modal Input**: Text, voice, images, and documents
- **Smart Pattern Recognition**: Automatically detects workflow patterns
- **GPT-4 Integration**: Advanced AI understanding and generation

### 📁 Advanced Document Processing
- **15+ File Types**: PDF, Word, Excel, CSV, JSON, Images, Code files
- **OCR Capabilities**: Extract text from images using Tesseract.js
- **Smart Parser**: Analyzes documents for workflow patterns
- **Folder Import**: Process entire project directories

### 🎙️ Voice & Speech
- **Voice Commands**: Speak your automation requirements
- **Speech-to-Text**: OpenAI Whisper integration
- **Multiple Providers**: Google Cloud Speech fallback
- **Real-time Transcription**: See your words convert to workflows

### 🎯 Interactive Demo Mode
- **8 Pre-built Scenarios**: From beginner to advanced
- **Guided Tour**: Step-by-step walkthrough
- **Sample Data**: Real-world examples included
- **Instant Testing**: Try before you build

## 🚀 Quick Start

### Try the Demo

1. Visit [the live site](https://n8n-ai-flow-9y2k2zhki-unite-group.vercel.app)
2. Sign in with your credentials
3. Click **"Start Demo"** on the dashboard
4. Choose a scenario that matches your needs
5. Watch the AI create your workflow

### Example Scenarios

- 📧 **Email to Slack**: Forward urgent emails to team channels
- 📊 **CSV to Database**: Import spreadsheet data with validation
- 🌐 **API Integration**: Connect multiple services
- 📅 **Scheduled Reports**: Automated daily/weekly reports
- 🖼️ **Image OCR**: Extract text and create tasks
- 🎤 **Voice Automation**: Process voice commands
- 📱 **Social Media**: Cross-platform content posting
- 🚀 **CI/CD Pipeline**: Automated deployment workflows

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI/ML**: OpenAI GPT-4, Whisper, Tesseract.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Workflow Engine**: n8n integration
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)
- OpenAI API key (optional, for AI features)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/CleanExpo/n8n-AI-Flow.git
cd n8n-AI-Flow/my-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=your-supabase-url
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key

# Optional (for AI features)
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_API_KEY=...
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### API Keys Setup

For full functionality, configure these optional API keys:

#### OpenAI (Recommended)
- Enables GPT-4 workflow generation
- Powers Whisper speech-to-text
- Get your key at [platform.openai.com](https://platform.openai.com)

#### Google Cloud (Optional)
- Alternative speech-to-text
- Vision API for OCR
- Enable APIs in [Google Cloud Console](https://console.cloud.google.com)

#### File System Paths
```env
USER_DOCUMENTS_PATH=/path/to/user/docs
SHARED_DOCUMENTS_PATH=/path/to/shared/docs
```

## 📚 Documentation

- [API Configuration Guide](./API_CONFIGURATION.md)
- [Deployment Summary](./DEPLOYMENT_SUMMARY.md)
- [Demo Data Library](./lib/demo-data.ts)

## 🎮 Usage Examples

### Natural Language Input
```
"Create a workflow that monitors my Gmail inbox for urgent emails 
and sends them to Slack channel #alerts"
```

### Document Upload
Upload a CSV file and the AI will:
1. Analyze the structure
2. Suggest data validation
3. Create database import workflow
4. Add error handling

### Voice Command
Click the microphone and say:
```
"Every Monday at 9 AM, generate a sales report from the database 
and email it to the team"
```

## 🔐 Security

- Session-based authentication with NextAuth.js
- Secure file path validation
- Environment variable protection
- API rate limiting ready
- Input sanitization

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CleanExpo/n8n-AI-Flow)

1. Click the button above
2. Configure environment variables
3. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## 📈 Roadmap

- [ ] Direct n8n instance integration
- [ ] Workflow marketplace
- [ ] Team collaboration
- [ ] Mobile app
- [ ] Self-hosted version
- [ ] Advanced AI training

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [n8n](https://n8n.io) - Workflow automation platform
- [Next.js](https://nextjs.org) - React framework
- [OpenAI](https://openai.com) - AI models
- [Vercel](https://vercel.com) - Deployment platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/CleanExpo/n8n-AI-Flow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CleanExpo/n8n-AI-Flow/discussions)

---

Built with ❤️ by the n8n AI Flow team