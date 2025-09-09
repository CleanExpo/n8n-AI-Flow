'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DemoMode } from '@/components/demo/DemoMode';
import { 
  Workflow, 
  Zap, 
  Database, 
  Cloud, 
  Shield, 
  BarChart3,
  Users,
  Rocket,
  ArrowRight,
  Play,
  Code,
  Globe,
  Sparkles,
  Timer,
  Bot,
  Layers,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Workflow className="h-6 w-6" />,
      title: 'Visual Workflow Builder',
      description: 'Drag and drop interface to create complex automation workflows without coding',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Real-time Execution',
      description: 'Execute workflows instantly with live monitoring and detailed logging',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Data Persistence',
      description: 'Secure storage with Supabase PostgreSQL and row-level security',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: <Cloud className="h-6 w-6" />,
      title: 'n8n Integration',
      description: 'Seamless integration with n8n workflow automation engine',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: 'AI-Powered Nodes',
      description: 'Built-in AI nodes for OpenAI, Anthropic, and Google AI integration',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Enterprise Security',
      description: 'API key authentication, webhook security, and encrypted data storage',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ];

  const stats = [
    { value: '40+', label: 'Node Types', icon: <Layers /> },
    { value: '100%', label: 'Open Source', icon: <Code /> },
    { value: '24/7', label: 'Automation', icon: <Timer /> },
    { value: '∞', label: 'Possibilities', icon: <Sparkles /> },
  ];

  const useCases = [
    {
      title: 'Data Processing',
      description: 'Transform, aggregate, and filter data from multiple sources',
      icon: <BarChart3 />,
    },
    {
      title: 'API Integration',
      description: 'Connect with any REST API, webhook, or third-party service',
      icon: <Globe />,
    },
    {
      title: 'Task Automation',
      description: 'Automate repetitive tasks and business processes',
      icon: <Rocket />,
    },
    {
      title: 'Team Collaboration',
      description: 'Share workflows and collaborate with your team',
      icon: <Users />,
    },
  ];

  const steps = [
    { number: '1', title: 'Design Your Workflow', description: 'Use our visual builder to drag and drop nodes' },
    { number: '2', title: 'Configure & Connect', description: 'Set up node parameters and connections' },
    { number: '3', title: 'Execute & Monitor', description: 'Run workflows and monitor in real-time' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Workflow className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">n8n AI Flow</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#use-cases" className="text-gray-700 hover:text-blue-600 transition-colors">Use Cases</a>
              <button 
                onClick={() => router.push('/auth/signin')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-2 space-y-1">
              <a href="#features" className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">Features</a>
              <a href="#how-it-works" className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">How It Works</a>
              <a href="#use-cases" className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">Use Cases</a>
              <button 
                onClick={() => router.push('/auth/signin')} 
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Sparkles className="mr-2 h-4 w-4" />
            Powered by n8n
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Build Powerful Automation
            <span className="block text-blue-600 mt-2">Workflows Visually</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create, execute, and monitor complex automation workflows with our intuitive 
            drag-and-drop interface. Integrate with 40+ node types and unlimited possibilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/auth/signin')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              Start Building
              <Rocket className="ml-2 h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowDemo(true)}
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Automation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive features to build, deploy, and manage your automation workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6">
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <div className={feature.color}>{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started with automation in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Endless Possibilities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Automate any process with our flexible workflow system
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-blue-600">{useCase.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                    <p className="text-gray-600">{useCase.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose n8n AI Flow?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              'No coding required',
              'Real-time monitoring',
              'Secure and scalable',
              'Open source',
              'AI-powered automation',
              'Enterprise ready'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Automate Your Workflows?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teams automating their processes with n8n AI Flow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/auth/signin')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button 
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Workflow className="h-6 w-6 text-blue-500" />
                <span className="text-white font-semibold">n8n AI Flow</span>
              </div>
              <p className="text-sm">
                Visual workflow automation powered by n8n
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-1 text-sm">
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">Features</a></li>
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">Pricing</a></li>
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">Documentation</a></li>
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-1 text-sm">
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">About</a></li>
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">Blog</a></li>
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">Careers</a></li>
                <li><a href="#" className="block py-3 px-2 -mx-2 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg min-h-[44px] flex items-center">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Connect</h4>
              <div className="flex space-x-2">
                <a href="#" className="hover:text-white transition-colors p-3 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 inline-flex items-center justify-center min-w-[44px] min-h-[44px]" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors p-3 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 inline-flex items-center justify-center min-w-[44px] min-h-[44px]" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors p-3 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 inline-flex items-center justify-center min-w-[44px] min-h-[44px]" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 n8n AI Flow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <DemoMode
          onClose={() => setShowDemo(false)}
          onSelectScenario={(scenario) => {
            setShowDemo(false);
            router.push('/ai-workflow');
          }}
        />
      )}
    </div>
  );
}