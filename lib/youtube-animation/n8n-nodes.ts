/**
 * n8n Workflow Nodes for YouTube Animation Generation
 * Custom nodes for AI Revolution and Julia McCoy style video creation
 */

export interface N8nYouTubeNode {
  id: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

// Custom node types for YouTube animation workflow
export const YouTubeAnimationNodes = {
  // Content ingestion nodes
  RSS_MONITOR: 'youtube-animation.rssMonitor',
  CONTENT_ANALYZER: 'youtube-animation.contentAnalyzer',
  STYLE_SELECTOR: 'youtube-animation.styleSelector',
  
  // Asset generation nodes
  TEXT_GENERATOR: 'youtube-animation.textGenerator',
  IMAGE_GENERATOR: 'youtube-animation.imageGenerator',
  CHART_GENERATOR: 'youtube-animation.chartGenerator',
  PARTICLE_GENERATOR: 'youtube-animation.particleGenerator',
  
  // Video assembly nodes
  SCENE_COMPOSER: 'youtube-animation.sceneComposer',
  VIDEO_RENDERER: 'youtube-animation.videoRenderer',
  AUDIO_MIXER: 'youtube-animation.audioMixer',
  
  // Publishing nodes
  YOUTUBE_PUBLISHER: 'youtube-animation.youtubePublisher',
  SOCIAL_DISTRIBUTOR: 'youtube-animation.socialDistributor',
  ANALYTICS_TRACKER: 'youtube-animation.analyticsTracker'
};

/**
 * RSS Monitor Node - Monitors news feeds for content
 */
export const createRSSMonitorNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `rss_monitor_${Date.now()}`,
  type: YouTubeAnimationNodes.RSS_MONITOR,
  position,
  parameters: {
    feedUrls: [
      'https://news.ycombinator.com/rss',
      'https://www.reddit.com/r/artificial/hot.rss',
      'https://ai.googleblog.com/feeds/posts/default',
      'https://openai.com/blog/rss.xml'
    ],
    pollInterval: 300, // 5 minutes
    filters: {
      keywords: ['GPT', 'AI', 'machine learning', 'neural network', 'breakthrough'],
      minScore: 100, // For HN posts
      excludeKeywords: ['[meta]', 'hiring']
    },
    output: {
      includeComments: true,
      includeMetadata: true,
      limit: 10
    }
  }
});

/**
 * Content Analyzer Node - Analyzes content for style selection
 */
export const createContentAnalyzerNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `content_analyzer_${Date.now()}`,
  type: YouTubeAnimationNodes.CONTENT_ANALYZER,
  position,
  parameters: {
    analysisType: 'comprehensive',
    features: {
      sentiment: true,
      urgency: true,
      technicalLevel: true,
      targetAudience: true,
      keywordExtraction: true,
      summaryGeneration: true
    },
    aiModel: 'gpt-4',
    prompt: `Analyze this content and determine:
    1. Type: breaking_news, tutorial, analysis, or case_study
    2. Urgency: high, medium, or low
    3. Technical level: beginner, intermediate, or advanced
    4. Target audience: technical, business, or general
    5. Key points (3-5 bullet points)
    6. Suggested video duration (in seconds)
    7. Recommended style: ai_revolution, julia_mccoy, or hybrid`,
    output: {
      format: 'json',
      includeConfidence: true
    }
  }
});

/**
 * Style Selector Node - Selects appropriate animation style
 */
export const createStyleSelectorNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `style_selector_${Date.now()}`,
  type: YouTubeAnimationNodes.STYLE_SELECTOR,
  position,
  parameters: {
    selectionMethod: 'ai_driven', // or 'rule_based'
    rules: [
      {
        condition: 'urgency === "high" && type === "breaking_news"',
        style: 'ai_revolution'
      },
      {
        condition: 'type === "tutorial" || type === "case_study"',
        style: 'julia_mccoy'
      },
      {
        condition: 'technicalLevel === "advanced" && targetAudience === "technical"',
        style: 'hybrid'
      }
    ],
    styleTemplates: {
      ai_revolution: {
        primaryColor: '#00ffff',
        backgroundType: 'particles',
        transitionType: 'glitch',
        musicStyle: 'dramatic',
        fontFamily: 'Orbitron'
      },
      julia_mccoy: {
        primaryColor: '#007bff',
        backgroundType: 'gradient',
        transitionType: 'fade',
        musicStyle: 'corporate',
        fontFamily: 'Montserrat'
      },
      hybrid: {
        primaryColor: '#00ffff',
        backgroundType: 'particles',
        transitionType: 'glitch',
        musicStyle: 'tech',
        fontFamily: 'Inter'
      }
    }
  }
});

/**
 * Text Generator Node - Generates animated text elements
 */
export const createTextGeneratorNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `text_generator_${Date.now()}`,
  type: YouTubeAnimationNodes.TEXT_GENERATOR,
  position,
  parameters: {
    textElements: [
      {
        type: 'headline',
        content: '{{content.headline}}',
        style: {
          fontSize: 72,
          fontWeight: 'bold',
          color: '{{style.primaryColor}}',
          glow: true,
          animation: 'typewriter'
        },
        timing: {
          startTime: 0,
          duration: 5,
          fadeIn: 0.5
        }
      },
      {
        type: 'subtitle',
        content: '{{content.subtitle}}',
        style: {
          fontSize: 36,
          fontWeight: 'normal',
          color: '#ffffff',
          animation: 'fadeIn'
        },
        timing: {
          startTime: 2,
          duration: 5
        }
      },
      {
        type: 'bullet_points',
        content: '{{content.keyPoints}}',
        style: {
          fontSize: 28,
          fontWeight: 'normal',
          color: '#ffffff',
          animation: 'slideIn',
          listStyle: 'numbered'
        },
        timing: {
          startTime: 7,
          duration: 10,
          stagger: 1 // Delay between points
        }
      }
    ],
    textEffects: {
      typewriter: {
        speed: 50, // ms per character
        cursor: true
      },
      glow: {
        color: '{{style.glowColor}}',
        intensity: 0.8,
        radius: 10
      },
      gradient: {
        colors: ['#00ffff', '#ff00ff'],
        angle: 45
      }
    }
  }
});

/**
 * Image Generator Node - Generates AI images
 */
export const createImageGeneratorNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `image_generator_${Date.now()}`,
  type: YouTubeAnimationNodes.IMAGE_GENERATOR,
  position,
  parameters: {
    service: 'openai', // or 'stability', 'midjourney'
    model: 'dall-e-3',
    images: [
      {
        prompt: 'futuristic AI brain neural network, cyberpunk style, glowing cyan connections',
        style: 'digital art',
        size: '1792x1024',
        quality: 'hd'
      }
    ],
    postProcessing: {
      effects: ['glow', 'particles'],
      colorAdjustment: {
        brightness: 1.2,
        contrast: 1.1,
        saturation: 1.3
      }
    },
    caching: {
      enabled: true,
      duration: 86400 // 24 hours
    }
  },
  credentials: {
    openaiApi: {
      apiKey: '{{$credentials.openaiApi.apiKey}}'
    }
  }
});

/**
 * Scene Composer Node - Composes video scenes
 */
export const createSceneComposerNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `scene_composer_${Date.now()}`,
  type: YouTubeAnimationNodes.SCENE_COMPOSER,
  position,
  parameters: {
    scenes: [
      {
        id: 'intro',
        duration: 5,
        layers: [
          { type: 'background', source: '{{particleBackground}}' },
          { type: 'text', source: '{{headline}}', position: 'center' },
          { type: 'logo', source: '{{channelLogo}}', position: 'bottom-right' }
        ],
        transitions: {
          in: 'fade',
          out: 'glitch'
        }
      },
      {
        id: 'main_content',
        duration: '{{calculatedDuration}}',
        layers: [
          { type: 'background', source: '{{background}}' },
          { type: 'text', source: '{{keyPoints}}', position: 'left' },
          { type: 'chart', source: '{{dataVisualization}}', position: 'right' },
          { type: 'image', source: '{{aiGeneratedImage}}', position: 'center' }
        ]
      },
      {
        id: 'outro',
        duration: 10,
        layers: [
          { type: 'background', source: '{{background}}' },
          { type: 'text', source: 'Subscribe for more!', position: 'center' },
          { type: 'social', source: '{{socialLinks}}', position: 'bottom' }
        ]
      }
    ],
    compositing: {
      blendMode: 'normal',
      opacity: 1.0,
      maskingEnabled: true
    }
  }
});

/**
 * Video Renderer Node - Renders final video
 */
export const createVideoRendererNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `video_renderer_${Date.now()}`,
  type: YouTubeAnimationNodes.VIDEO_RENDERER,
  position,
  parameters: {
    renderSettings: {
      resolution: '1920x1080',
      fps: 30,
      codec: 'h264',
      bitrate: '10M',
      format: 'mp4'
    },
    renderEngine: 'ffmpeg', // or 'remotion', 'after-effects'
    optimization: {
      hardwareAcceleration: true,
      multiThreading: true,
      caching: true
    },
    output: {
      path: '/rendered/{{videoId}}.mp4',
      generateThumbnail: true,
      generatePreview: true
    }
  }
});

/**
 * YouTube Publisher Node - Publishes to YouTube
 */
export const createYouTubePublisherNode = (position: [number, number]): N8nYouTubeNode => ({
  id: `youtube_publisher_${Date.now()}`,
  type: YouTubeAnimationNodes.YOUTUBE_PUBLISHER,
  position,
  parameters: {
    video: {
      title: '{{generatedTitle}}',
      description: '{{generatedDescription}}',
      tags: '{{generatedTags}}',
      category: 'Science & Technology',
      privacy: 'public', // or 'private', 'unlisted'
      thumbnail: '{{generatedThumbnail}}'
    },
    scheduling: {
      publishImmediately: true,
      scheduledTime: null,
      timezone: 'UTC'
    },
    optimization: {
      autoCaption: true,
      endScreen: true,
      cards: true,
      playlist: 'AI News Updates'
    },
    analytics: {
      trackPerformance: true,
      notifyOnMilestone: true,
      compareWithPrevious: true
    }
  },
  credentials: {
    youtubeOAuth2Api: {
      accessToken: '{{$credentials.youtubeOAuth2Api.accessToken}}',
      refreshToken: '{{$credentials.youtubeOAuth2Api.refreshToken}}'
    }
  }
});

/**
 * Complete workflow builder
 */
export function buildYouTubeAnimationWorkflow(style: 'ai_revolution' | 'julia_mccoy' | 'hybrid') {
  const nodes: N8nYouTubeNode[] = [
    createRSSMonitorNode([250, 100]),
    createContentAnalyzerNode([450, 100]),
    createStyleSelectorNode([650, 100]),
    createTextGeneratorNode([850, 100]),
    createImageGeneratorNode([850, 300]),
    createSceneComposerNode([1050, 200]),
    createVideoRendererNode([1250, 200]),
    createYouTubePublisherNode([1450, 200])
  ];

  const connections = [
    { source: nodes[0].id, target: nodes[1].id },
    { source: nodes[1].id, target: nodes[2].id },
    { source: nodes[2].id, target: nodes[3].id },
    { source: nodes[2].id, target: nodes[4].id },
    { source: nodes[3].id, target: nodes[5].id },
    { source: nodes[4].id, target: nodes[5].id },
    { source: nodes[5].id, target: nodes[6].id },
    { source: nodes[6].id, target: nodes[7].id }
  ];

  return {
    name: `YouTube Animation Workflow - ${style}`,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
      saveDataSuccessExecution: true,
      saveDataErrorExecution: true,
      saveExecutionProgress: true,
      timeout: 3600, // 1 hour for video rendering
      maxExecutionTime: 7200 // 2 hours max
    }
  };
}

/**
 * Export workflow as n8n JSON
 */
export function exportWorkflowAsN8nJSON(workflow: any) {
  return {
    name: workflow.name,
    nodes: workflow.nodes.map((node: N8nYouTubeNode) => ({
      parameters: node.parameters,
      id: node.id,
      name: node.type.split('.').pop(),
      type: node.type,
      typeVersion: 1,
      position: node.position,
      credentials: node.credentials
    })),
    connections: workflow.connections.reduce((acc: any, conn: any) => {
      if (!acc[conn.source]) acc[conn.source] = { main: [[]] };
      acc[conn.source].main[0].push({
        node: conn.target,
        type: 'main',
        index: 0
      });
      return acc;
    }, {}),
    settings: workflow.settings,
    staticData: null,
    tags: ['youtube', 'animation', 'ai-generated'],
    updatedAt: new Date().toISOString(),
    versionId: '1.0.0'
  };
}