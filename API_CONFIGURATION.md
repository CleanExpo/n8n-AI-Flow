# n8n AI Flow - API Configuration Guide

This guide explains how to configure the various APIs to enable all features in the n8n AI Flow application.

## Table of Contents
1. [OpenAI Configuration](#openai-configuration)
2. [Google Cloud Configuration](#google-cloud-configuration)
3. [Azure Configuration](#azure-configuration)
4. [File System Configuration](#file-system-configuration)
5. [Feature Availability](#feature-availability)

## OpenAI Configuration

### Required for:
- Advanced workflow generation with GPT-4
- Speech-to-text with Whisper API
- Intelligent content analysis

### Setup:
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### Features Enabled:
- ✅ AI-powered workflow generation
- ✅ Voice input transcription
- ✅ Smart document understanding
- ✅ Natural language workflow creation

## Google Cloud Configuration

### Required for:
- Google Vision OCR
- Google Speech-to-Text
- Google Sheets integration

### Setup:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable required APIs:
   - Cloud Vision API
   - Cloud Speech-to-Text API
   - Google Sheets API
3. Create credentials and download service account key
4. Add to `.env.local`:
```bash
GOOGLE_CLOUD_API_KEY=your-api-key
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

### Features Enabled:
- ✅ OCR for images and scanned documents
- ✅ Alternative speech recognition
- ✅ Direct Google Sheets operations

## Azure Configuration

### Required for:
- Azure Computer Vision OCR
- Azure Speech Services

### Setup:
1. Create resources in [Azure Portal](https://portal.azure.com)
2. Get keys from Computer Vision and Speech resources
3. Add to `.env.local`:
```bash
AZURE_COMPUTER_VISION_KEY=your-key
AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=your-region
```

### Features Enabled:
- ✅ Alternative OCR engine
- ✅ Alternative speech recognition
- ✅ Multi-language support

## File System Configuration

### Required for:
- Local file browsing
- Document processing
- Project imports

### Setup:
Add to `.env.local`:
```bash
# Define safe paths for file access
USER_DOCUMENTS_PATH=/path/to/user/documents
SHARED_DOCUMENTS_PATH=/path/to/shared/documents

# Optional: Max file size for processing (in MB)
MAX_FILE_SIZE=50
```

### Default Paths:
If not configured, the app uses:
- `./user-documents` - User's private documents
- `./shared-documents` - Shared team documents
- `./public/uploads` - Uploaded files

## Feature Availability

### Without Any API Keys (Demo Mode)
- ✅ Pattern-based workflow generation
- ✅ Basic file upload and preview
- ✅ Manual workflow creation
- ⚠️ Limited speech-to-text (returns demo text)
- ⚠️ No OCR (images not processed)
- ⚠️ Basic document parsing only

### With OpenAI API
- ✅ Advanced AI workflow generation
- ✅ Intelligent context understanding
- ✅ Whisper speech-to-text
- ✅ Smart suggestions and optimization

### With Google Cloud API
- ✅ Google Vision OCR
- ✅ Google Speech-to-Text
- ✅ Multi-language document processing

### With All APIs Configured
- ✅ Full feature set
- ✅ Fallback options for reliability
- ✅ Best accuracy and performance
- ✅ Multi-modal input processing

## Testing Your Configuration

After adding API keys, test each feature:

1. **Test OpenAI**: Try generating a workflow with natural language
2. **Test OCR**: Upload an image with text
3. **Test Speech**: Use the microphone button to record
4. **Test File System**: Browse local files

## Security Notes

1. **Never commit `.env.local` to version control**
2. Add `.env.local` to `.gitignore`
3. Use environment variables in production
4. Rotate API keys regularly
5. Set up API usage limits and alerts

## Troubleshooting

### OpenAI Not Working
- Check API key is valid
- Verify you have credits/payment method
- Check rate limits

### OCR Not Working
- Verify image format (JPEG, PNG, etc.)
- Check file size limits
- Ensure API is enabled in cloud console

### File Browsing Not Working
- Check path permissions
- Verify paths exist
- Ensure paths are absolute, not relative

## Cost Optimization

To minimize API costs:

1. **Use Demo Mode for Development**: Test without API keys first
2. **Implement Caching**: Cache API responses when possible
3. **Set Rate Limits**: Limit API calls per user/session
4. **Use Webhooks**: For n8n triggers instead of polling
5. **Batch Operations**: Process multiple items in single API calls

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review API provider documentation
- Contact support with error logs

---

## Quick Start

Minimal configuration for basic features:

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
```

This enables AI workflow generation and speech-to-text. Add more APIs as needed.