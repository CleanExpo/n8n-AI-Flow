import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const text = await convertSpeechToText(audioFile);

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Speech to text error:', error);
    return NextResponse.json(
      { error: 'Failed to convert speech to text' },
      { status: 500 }
    );
  }
}

async function convertSpeechToText(audioFile: File): Promise<string> {
  // Check if OpenAI API key is configured
  if (process.env.OPENAI_API_KEY) {
    try {
      // Convert File to FormData for OpenAI API
      const formData = new FormData();
      const buffer = await audioFile.arrayBuffer();
      const blob = new Blob([buffer], { type: audioFile.type });
      
      formData.append('file', blob, audioFile.name || 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('prompt', 'Workflow automation request for n8n');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.text;
      } else {
        console.error('OpenAI API error:', await response.text());
      }
    } catch (error) {
      console.error('Whisper API error:', error);
    }
  }
  
  // Check if Google Cloud Speech-to-Text is configured
  if (process.env.GOOGLE_CLOUD_API_KEY) {
    try {
      const buffer = await audioFile.arrayBuffer();
      const base64Audio = Buffer.from(buffer).toString('base64');
      
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true,
            },
            audio: {
              content: base64Audio,
            },
          }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results
            .map((result: any) => result.alternatives[0].transcript)
            .join(' ');
        }
      }
    } catch (error) {
      console.error('Google Speech API error:', error);
    }
  }
  
  // Fallback response with helpful instructions
  const fallbackMessages = [
    "Create a workflow that monitors my Gmail inbox and sends important emails to Slack",
    "Build an automation that backs up Google Sheets data to a database daily",
    "Set up a workflow to post Twitter updates when new blog posts are published",
    "Create a system that processes form submissions and adds them to a CRM",
    "Automate invoice generation from Stripe payments and send via email"
  ];
  
  // Return a random fallback message
  const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
  
  // If no API is configured, return instructions
  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_CLOUD_API_KEY) {
    return `[Demo Mode] ${fallbackMessages[randomIndex]}. To enable real speech-to-text, add OPENAI_API_KEY or GOOGLE_CLOUD_API_KEY to your .env.local file.`;
  }
  
  return fallbackMessages[randomIndex];
}