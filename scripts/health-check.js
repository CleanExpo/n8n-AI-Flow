#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class HealthChecker {
  constructor() {
    this.score = 0;
    this.maxScore = 100;
    this.checks = [];
    this.errors = [];
  }

  check(name, condition, points, errorMessage = '') {
    const passed = typeof condition === 'function' ? condition() : condition;
    if (passed) {
      this.score += points;
      this.checks.push({ name, passed: true, points });
    } else {
      this.checks.push({ name, passed: false, points });
      if (errorMessage) this.errors.push(errorMessage);
    }
    return this;
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(process.cwd(), filePath));
  }

  fileContains(filePath, content) {
    if (!this.fileExists(filePath)) return false;
    const fileContent = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    return fileContent.includes(content);
  }

  jsonHasProperty(filePath, property) {
    if (!this.fileExists(filePath)) return false;
    try {
      const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), filePath), 'utf8'));
      return property.split('.').reduce((obj, key) => obj && obj[key], json) !== undefined;
    } catch {
      return false;
    }
  }

  run() {
    console.log('🏥 Running n8n AI Flow Health Check...\n');

    // Security Headers (15 points)
    this.check(
      'Security Headers Implementation',
      () => this.fileExists('lib/security/headers.ts'),
      5,
      'Security headers file missing'
    );

    this.check(
      'CSP Headers Present',
      () => this.fileContains('lib/security/headers.ts', 'Content-Security-Policy'),
      5,
      'Content Security Policy not implemented'
    );

    this.check(
      'Security Headers in Middleware',
      () => this.fileContains('middleware.ts', 'applySecurityHeaders'),
      5,
      'Security headers not applied in middleware'
    );

    // Error Handling (15 points)
    this.check(
      'Error Boundary Component',
      () => this.fileExists('components/error/ErrorBoundary.tsx'),
      8,
      'Error Boundary component missing'
    );

    this.check(
      'Error Boundary in Layout',
      () => this.fileContains('app/layout.tsx', 'ErrorBoundary'),
      7,
      'Error Boundary not implemented in root layout'
    );

    // SEO Optimization (15 points)
    this.check(
      'Robots.txt Present',
      () => this.fileExists('public/robots.txt'),
      3,
      'robots.txt file missing'
    );

    this.check(
      'Sitemap Implementation',
      () => this.fileExists('app/sitemap.ts'),
      4,
      'sitemap.ts not implemented'
    );

    this.check(
      'Rich Meta Tags',
      () => this.fileContains('app/layout.tsx', 'openGraph'),
      4,
      'Open Graph meta tags not implemented'
    );

    this.check(
      'Structured Data',
      () => this.fileContains('app/layout.tsx', 'twitter'),
      4,
      'Twitter Card meta tags not implemented'
    );

    // PWA Implementation (15 points)
    this.check(
      'Web App Manifest',
      () => this.fileExists('public/manifest.json'),
      8,
      'Web app manifest missing'
    );

    this.check(
      'Manifest Linked in Layout',
      () => this.fileContains('app/layout.tsx', 'manifest.json'),
      4,
      'Manifest not linked in HTML head'
    );

    this.check(
      'Theme Color Meta Tag',
      () => this.fileContains('app/layout.tsx', 'theme-color'),
      3,
      'Theme color meta tag missing'
    );

    // Testing Framework (15 points)
    this.check(
      'Jest Configuration',
      () => this.fileExists('jest.config.js'),
      5,
      'Jest configuration missing'
    );

    this.check(
      'Jest Setup File',
      () => this.fileExists('jest.setup.js'),
      3,
      'Jest setup file missing'
    );

    this.check(
      'Testing Scripts in Package.json',
      () => this.jsonHasProperty('package.json', 'scripts.test'),
      4,
      'Test scripts not configured in package.json'
    );

    this.check(
      'Testing Dependencies',
      () => this.jsonHasProperty('package.json', 'devDependencies.@testing-library/react'),
      3,
      'Testing dependencies not installed'
    );

    // Build Configuration (10 points)
    this.check(
      'TypeScript Strict Mode',
      () => !this.fileContains('next.config.mjs', 'ignoreBuildErrors: true'),
      5,
      'TypeScript build errors are being ignored'
    );

    this.check(
      'ESLint Enabled',
      () => !this.fileContains('next.config.mjs', 'ignoreDuringBuilds: true'),
      5,
      'ESLint errors are being ignored during builds'
    );

    // Performance Optimization (10 points)
    this.check(
      'Next.js Image Optimization',
      () => this.fileContains('next.config.mjs', 'images'),
      3,
      'Image optimization not configured'
    );

    this.check(
      'Compression Enabled',
      () => this.fileContains('next.config.mjs', 'compress: true'),
      2,
      'Compression not enabled'
    );

    this.check(
      'SWC Minification',
      () => this.fileContains('next.config.mjs', 'swcMinify: true'),
      2,
      'SWC minification not enabled'
    );

    this.check(
      'Powered By Header Removed',
      () => this.fileContains('next.config.mjs', 'poweredByHeader: false'),
      3,
      'X-Powered-By header not removed'
    );

    // Accessibility (5 points)
    this.check(
      'Semantic HTML Structure',
      () => this.fileContains('app/layout.tsx', 'lang="en"'),
      2,
      'HTML lang attribute not set'
    );

    this.check(
      'Viewport Meta Tag',
      () => this.fileContains('app/layout.tsx', 'viewport'),
      3,
      'Viewport meta tag not properly configured'
    );

    this.generateReport();
    return this.score;
  }

  generateReport() {
    console.log('📊 Health Check Results\n');
    console.log('='.repeat(50));
    
    const percentage = Math.round((this.score / this.maxScore) * 100);
    const grade = this.getGrade(percentage);
    
    console.log(`Overall Score: ${this.score}/${this.maxScore} (${percentage}%)`);
    console.log(`Grade: ${grade.emoji} ${grade.letter}\n`);

    // Group checks by status
    const passed = this.checks.filter(c => c.passed);
    const failed = this.checks.filter(c => !c.passed);

    if (passed.length > 0) {
      console.log('✅ Passed Checks:');
      passed.forEach(check => {
        console.log(`  • ${check.name} (+${check.points} points)`);
      });
      console.log('');
    }

    if (failed.length > 0) {
      console.log('❌ Failed Checks:');
      failed.forEach(check => {
        console.log(`  • ${check.name} (${check.points} points)`);
      });
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('🔧 Issues to Fix:');
      this.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
      console.log('');
    }

    this.showRecommendations(percentage);
  }

  getGrade(percentage) {
    if (percentage >= 95) return { letter: 'A+', emoji: '🏆' };
    if (percentage >= 90) return { letter: 'A', emoji: '🥇' };
    if (percentage >= 85) return { letter: 'A-', emoji: '🏅' };
    if (percentage >= 80) return { letter: 'B+', emoji: '👏' };
    if (percentage >= 75) return { letter: 'B', emoji: '👍' };
    if (percentage >= 70) return { letter: 'B-', emoji: '📈' };
    if (percentage >= 65) return { letter: 'C+', emoji: '⚠️' };
    if (percentage >= 60) return { letter: 'C', emoji: '🔄' };
    return { letter: 'F', emoji: '🚨' };
  }

  showRecommendations(percentage) {
    console.log('💡 Recommendations:\n');
    
    if (percentage >= 95) {
      console.log('🎉 Excellent! Your application meets the highest health standards.');
      console.log('   Consider running Lighthouse audits for final validation.');
    } else if (percentage >= 85) {
      console.log('🎯 Great progress! Address the remaining failed checks');
      console.log('   to achieve a perfect health score.');
    } else if (percentage >= 70) {
      console.log('📈 Good foundation! Focus on security and performance');
      console.log('   optimizations to improve your score.');
    } else {
      console.log('🚨 Critical issues detected! Address failed checks');
      console.log('   immediately to improve application health.');
    }

    console.log('\n📚 Next Steps:');
    console.log('   1. Fix all failed checks listed above');
    console.log('   2. Run `npm run build` to verify build passes');
    console.log('   3. Run `npm test` to ensure tests pass');
    console.log('   4. Test security headers with securityheaders.com');
    console.log('   5. Run Lighthouse audit for final validation');
    console.log('\n📖 See HEALTH_CHECK_ACTION_PLAN.md for detailed guidance');
  }
}

// Run the health check
const checker = new HealthChecker();
const score = checker.run();

// Exit with appropriate code
process.exit(score >= 95 ? 0 : 1);