/**
 * YouTube Animation Workflow Templates
 * Based on analysis of AI Revolution and Julia McCoy channels
 */

export interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  style: 'ai_revolution' | 'julia_mccoy' | 'hybrid';
  duration: number; // in seconds
  elements: AnimationElement[];
  transitions: TransitionEffect[];
  audioProfile: AudioProfile;
  colorPalette: ColorPalette;
}

export interface AnimationElement {
  type: 'text' | 'background' | 'particle' | 'chart' | 'image' | 'video';
  timing: {
    startTime: number;
    duration: number;
    fadeIn?: number;
    fadeOut?: number;
  };
  properties: Record<string, any>;
  animations?: Animation[];
}

export interface Animation {
  property: string;
  from: any;
  to: any;
  duration: number;
  easing?: string;
}

export interface TransitionEffect {
  type: 'glitch' | 'fade' | 'slide' | 'particle_burst' | 'matrix_wipe';
  duration: number;
  properties?: Record<string, any>;
}

export interface AudioProfile {
  backgroundMusic: {
    style: 'dramatic' | 'professional' | 'tech' | 'corporate';
    volume: number;
  };
  soundEffects: boolean;
  voiceOver: {
    enabled: boolean;
    style: 'authoritative' | 'conversational' | 'educational';
    speed: number;
  };
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  glow?: string;
}

// AI Revolution Style Template
export const aiRevolutionTemplate: AnimationTemplate = {
  id: 'ai_revolution',
  name: 'AI Revolution Style',
  description: 'Dramatic, tech-focused with particle effects and glowing text',
  style: 'ai_revolution',
  duration: 600, // 10 minutes default
  elements: [
    {
      type: 'background',
      timing: { startTime: 0, duration: 600 },
      properties: {
        type: 'particle_system',
        particleCount: 500,
        particleColor: '#00ffff',
        particleSpeed: 0.5,
        backgroundGradient: ['#1a1a2e', '#16213e', '#0f3460'],
      },
      animations: [
        {
          property: 'particleSpeed',
          from: 0.5,
          to: 1.5,
          duration: 10,
          easing: 'easeInOutQuad'
        }
      ]
    },
    {
      type: 'text',
      timing: { startTime: 0, duration: 5, fadeIn: 0.5, fadeOut: 0.5 },
      properties: {
        content: '{{headline}}',
        fontSize: 72,
        fontFamily: 'Orbitron, monospace',
        color: '#ffffff',
        glow: true,
        glowColor: '#00ffff',
        position: { x: 'center', y: 'center' }
      },
      animations: [
        {
          property: 'scale',
          from: 0.8,
          to: 1.0,
          duration: 0.5,
          easing: 'backOut'
        }
      ]
    }
  ],
  transitions: [
    {
      type: 'glitch',
      duration: 0.3,
      properties: {
        intensity: 0.8,
        color: '#00ffff'
      }
    }
  ],
  audioProfile: {
    backgroundMusic: {
      style: 'dramatic',
      volume: 0.3
    },
    soundEffects: true,
    voiceOver: {
      enabled: true,
      style: 'authoritative',
      speed: 1.0
    }
  },
  colorPalette: {
    primary: '#00ffff',
    secondary: '#ff00ff',
    accent: '#ffff00',
    background: '#1a1a2e',
    text: '#ffffff',
    glow: '#00ffff'
  }
};

// Julia McCoy Style Template
export const juliaMccoyTemplate: AnimationTemplate = {
  id: 'julia_mccoy',
  name: 'Julia McCoy Style',
  description: 'Professional, clean business presentation with data visualization',
  style: 'julia_mccoy',
  duration: 900, // 15 minutes default
  elements: [
    {
      type: 'background',
      timing: { startTime: 0, duration: 900 },
      properties: {
        type: 'gradient',
        colors: ['#ffffff', '#f8f9fa'],
        direction: 'diagonal'
      }
    },
    {
      type: 'text',
      timing: { startTime: 0, duration: 5, fadeIn: 0.3 },
      properties: {
        content: '{{title}}',
        fontSize: 48,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 700,
        color: '#212529',
        position: { x: 'center', y: 100 }
      }
    },
    {
      type: 'chart',
      timing: { startTime: 5, duration: 10, fadeIn: 0.5 },
      properties: {
        type: 'line',
        data: '{{chartData}}',
        colors: ['#007bff', '#28a745'],
        animated: true,
        position: { x: 'center', y: 'center' },
        size: { width: 800, height: 400 }
      },
      animations: [
        {
          property: 'dataProgress',
          from: 0,
          to: 1,
          duration: 2,
          easing: 'easeOutQuart'
        }
      ]
    }
  ],
  transitions: [
    {
      type: 'fade',
      duration: 0.5
    }
  ],
  audioProfile: {
    backgroundMusic: {
      style: 'corporate',
      volume: 0.2
    },
    soundEffects: false,
    voiceOver: {
      enabled: true,
      style: 'educational',
      speed: 0.95
    }
  },
  colorPalette: {
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#28a745',
    background: '#ffffff',
    text: '#212529'
  }
};

// Content Analysis Function
export interface ContentAnalysis {
  type: 'breaking_news' | 'tutorial' | 'analysis' | 'case_study';
  urgency: 'high' | 'medium' | 'low';
  technicalLevel: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: 'technical' | 'business' | 'general';
}

export function selectTemplate(analysis: ContentAnalysis): AnimationTemplate {
  // High urgency breaking news -> AI Revolution style
  if (analysis.urgency === 'high' && analysis.type === 'breaking_news') {
    return aiRevolutionTemplate;
  }
  
  // Educational content -> Julia McCoy style
  if (analysis.type === 'tutorial' || analysis.type === 'case_study') {
    return juliaMccoyTemplate;
  }
  
  // Technical analysis -> Hybrid approach
  if (analysis.type === 'analysis' && analysis.technicalLevel === 'advanced') {
    return createHybridTemplate();
  }
  
  // Default based on audience
  return analysis.targetAudience === 'business' ? juliaMccoyTemplate : aiRevolutionTemplate;
}

// Hybrid Template Creator
export function createHybridTemplate(): AnimationTemplate {
  return {
    id: 'hybrid',
    name: 'Hybrid Style',
    description: 'Combines dramatic visuals with professional data presentation',
    style: 'hybrid',
    duration: 720,
    elements: [
      ...aiRevolutionTemplate.elements.filter(e => e.type === 'background'),
      ...juliaMccoyTemplate.elements.filter(e => e.type === 'chart' || e.type === 'text')
    ],
    transitions: aiRevolutionTemplate.transitions,
    audioProfile: {
      ...juliaMccoyTemplate.audioProfile,
      soundEffects: true
    },
    colorPalette: {
      ...aiRevolutionTemplate.colorPalette,
      accent: juliaMccoyTemplate.colorPalette.primary
    }
  };
}

// Workflow Node Configuration
export interface VideoWorkflowNode {
  id: string;
  type: string;
  data: {
    template: AnimationTemplate;
    content: Record<string, any>;
    outputFormat: 'mp4' | 'webm' | 'gif';
    resolution: '1080p' | '720p' | '4k';
    fps: 30 | 60;
  };
}

// Asset Generation Configuration
export interface AssetGenerationConfig {
  aiService: 'openai' | 'anthropic' | 'stability' | 'midjourney';
  quality: 'draft' | 'standard' | 'high';
  style: {
    visual: 'photorealistic' | 'illustration' | 'abstract' | '3d';
    mood: 'dramatic' | 'professional' | 'friendly' | 'technical';
  };
  branding: {
    logo?: string;
    watermark?: boolean;
    colors: ColorPalette;
  };
}

// Publishing Configuration
export interface PublishingConfig {
  platforms: Array<'youtube' | 'twitter' | 'linkedin' | 'tiktok'>;
  schedule: {
    immediate: boolean;
    time?: Date;
    timezone?: string;
  };
  optimization: {
    title: string;
    description: string;
    tags: string[];
    thumbnail: string;
    category: string;
  };
  analytics: {
    trackEngagement: boolean;
    abTesting: boolean;
    performanceGoals: {
      views: number;
      engagement: number;
      retention: number;
    };
  };
}

// Complete Workflow Configuration
export interface YouTubeAnimationWorkflow {
  id: string;
  name: string;
  trigger: 'manual' | 'scheduled' | 'webhook' | 'rss';
  contentSource: {
    type: 'api' | 'rss' | 'database' | 'manual';
    url?: string;
    filters?: Record<string, any>;
  };
  analysis: ContentAnalysis;
  template: AnimationTemplate;
  assetGeneration: AssetGenerationConfig;
  publishing: PublishingConfig;
  monitoring: {
    alerts: boolean;
    reportingInterval: 'daily' | 'weekly' | 'monthly';
    metrics: string[];
  };
}

// Export workflow presets
export const workflowPresets = {
  breakingNews: {
    name: 'Breaking AI News',
    trigger: 'rss',
    template: aiRevolutionTemplate,
    publishing: {
      platforms: ['youtube', 'twitter'],
      schedule: { immediate: true },
      optimization: {
        category: 'Science & Technology'
      }
    }
  },
  educationalContent: {
    name: 'AI Education Series',
    trigger: 'scheduled',
    template: juliaMccoyTemplate,
    publishing: {
      platforms: ['youtube', 'linkedin'],
      schedule: { immediate: false },
      optimization: {
        category: 'Education'
      }
    }
  },
  hybridAnalysis: {
    name: 'Technical Deep Dive',
    trigger: 'manual',
    template: createHybridTemplate(),
    publishing: {
      platforms: ['youtube'],
      schedule: { immediate: false },
      optimization: {
        category: 'Science & Technology'
      }
    }
  }
};