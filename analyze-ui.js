const { chromium } = require('playwright');
const fs = require('fs').promises;

async function analyzeUI() {
  console.log('🎭 Starting UI/UX Analysis with Playwright...\n');
  
  const browser = await chromium.launch({ headless: false });
  const issues = [];
  const improvements = [];

  try {
    // Desktop Analysis
    console.log('📱 Analyzing Desktop View (1920x1080)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopContext.newPage();
    
    await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);
    
    // Take desktop screenshot
    await desktopPage.screenshot({ 
      path: 'desktop-view.png', 
      fullPage: true 
    });
    console.log('✅ Desktop screenshot saved: desktop-view.png');

    // Analyze contrast and accessibility on desktop
    console.log('\n🔍 Checking Accessibility & Contrast...');
    
    // Check text contrast
    const contrastIssues = await desktopPage.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const color = styles.color;
        
        // Check for potentially problematic combinations
        if (bgColor && color) {
          // Parse RGB values
          const getBrightness = (rgbString) => {
            const match = rgbString.match(/\d+/g);
            if (!match) return null;
            const [r, g, b] = match.map(Number);
            return (r * 299 + g * 587 + b * 114) / 1000;
          };
          
          const bgBrightness = getBrightness(bgColor);
          const textBrightness = getBrightness(color);
          
          if (bgBrightness && textBrightness) {
            const contrast = Math.abs(bgBrightness - textBrightness);
            
            // Low contrast detection
            if (contrast < 50) {
              const text = el.textContent?.trim();
              if (text && text.length > 0 && text.length < 100) {
                issues.push({
                  element: el.tagName,
                  text: text.substring(0, 50),
                  bgColor,
                  textColor: color,
                  contrast: contrast.toFixed(2)
                });
              }
            }
          }
        }
      });
      
      return issues.slice(0, 5); // Return top 5 issues
    });
    
    if (contrastIssues.length > 0) {
      console.log('⚠️ Potential contrast issues found:');
      contrastIssues.forEach(issue => {
        console.log(`  - ${issue.element}: "${issue.text}" (contrast: ${issue.contrast})`);
        issues.push(`Low contrast: ${issue.element} with text "${issue.text}"`);
      });
    } else {
      console.log('✅ No major contrast issues detected');
    }

    // Check button sizes and clickable areas
    const buttonAnalysis = await desktopPage.evaluate(() => {
      const buttons = document.querySelectorAll('button, a[href]');
      const analysis = {
        total: buttons.length,
        tooSmall: [],
        goodSize: 0
      };
      
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        const area = rect.width * rect.height;
        
        if (area > 0 && area < 1600) { // Less than 40x40 pixels
          analysis.tooSmall.push({
            text: btn.textContent?.trim().substring(0, 30),
            width: rect.width.toFixed(0),
            height: rect.height.toFixed(0)
          });
        } else if (area >= 1600) {
          analysis.goodSize++;
        }
      });
      
      return analysis;
    });
    
    console.log(`\n🔘 Button/Link Analysis:`);
    console.log(`  - Total interactive elements: ${buttonAnalysis.total}`);
    console.log(`  - Good size (≥40x40px): ${buttonAnalysis.goodSize}`);
    if (buttonAnalysis.tooSmall.length > 0) {
      console.log(`  - Too small: ${buttonAnalysis.tooSmall.length}`);
      buttonAnalysis.tooSmall.slice(0, 3).forEach(btn => {
        console.log(`    • "${btn.text}" (${btn.width}x${btn.height}px)`);
      });
      issues.push(`${buttonAnalysis.tooSmall.length} clickable elements may be too small`);
    }

    // Check for horizontal scrolling
    const hasHorizontalScroll = await desktopPage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll) {
      console.log('⚠️ Horizontal scrolling detected on desktop');
      issues.push('Horizontal scrolling on desktop view');
    }

    // Mobile Analysis
    console.log('\n📱 Analyzing Mobile View (375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const mobilePage = await mobileContext.newPage();
    
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);
    
    // Take mobile screenshot
    await mobilePage.screenshot({ 
      path: 'mobile-view.png', 
      fullPage: true 
    });
    console.log('✅ Mobile screenshot saved: mobile-view.png');

    // Check mobile menu functionality
    const hasMobileMenu = await mobilePage.$('button[aria-label*="menu" i]');
    if (hasMobileMenu) {
      console.log('✅ Mobile menu button found');
      
      // Test menu toggle
      await hasMobileMenu.click();
      await mobilePage.waitForTimeout(500);
      
      const menuVisible = await mobilePage.evaluate(() => {
        const nav = document.querySelector('nav');
        return nav && window.getComputedStyle(nav).display !== 'none';
      });
      
      if (menuVisible) {
        console.log('✅ Mobile menu toggles correctly');
      } else {
        console.log('⚠️ Mobile menu may not be working properly');
        issues.push('Mobile menu functionality issue');
      }
    } else {
      console.log('⚠️ No mobile menu button found');
      issues.push('Missing mobile menu button');
    }

    // Check text readability on mobile
    const mobileTextSizes = await mobilePage.evaluate(() => {
      const texts = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
      const sizes = {
        tooSmall: 0,
        good: 0,
        samples: []
      };
      
      texts.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < 12) {
          sizes.tooSmall++;
          if (sizes.samples.length < 3) {
            sizes.samples.push({
              tag: el.tagName,
              size: fontSize,
              text: el.textContent?.substring(0, 30)
            });
          }
        } else {
          sizes.good++;
        }
      });
      
      return sizes;
    });
    
    console.log('\n📝 Mobile Text Readability:');
    console.log(`  - Readable text: ${mobileTextSizes.good}`);
    if (mobileTextSizes.tooSmall > 0) {
      console.log(`  - Text too small (<12px): ${mobileTextSizes.tooSmall}`);
      mobileTextSizes.samples.forEach(sample => {
        console.log(`    • ${sample.tag}: ${sample.size}px - "${sample.text}"`);
      });
      issues.push(`${mobileTextSizes.tooSmall} text elements too small on mobile`);
    }

    // Check mobile horizontal scrolling
    const hasMobileHScroll = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasMobileHScroll) {
      console.log('⚠️ Horizontal scrolling detected on mobile');
      issues.push('Horizontal scrolling on mobile view');
    }

    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    const metrics = await desktopPage.evaluate(() => {
      const perf = performance.timing;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
        loadComplete: perf.loadEventEnd - perf.navigationStart
      };
    });
    
    console.log(`  - DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`  - Page Load Complete: ${metrics.loadComplete}ms`);
    
    if (metrics.loadComplete > 3000) {
      issues.push(`Slow page load: ${metrics.loadComplete}ms`);
    }

    // Generate recommendations
    console.log('\n💡 Recommendations:');
    
    if (issues.length === 0) {
      console.log('  ✅ Great job! No major issues detected.');
      improvements.push('Consider adding loading animations for better perceived performance');
      improvements.push('Add focus indicators for keyboard navigation');
      improvements.push('Consider implementing dark mode for better accessibility');
    } else {
      if (contrastIssues.length > 0) {
        improvements.push('Increase contrast ratios to meet WCAG AA standards (4.5:1 for normal text)');
      }
      if (buttonAnalysis.tooSmall.length > 0) {
        improvements.push('Increase touch target sizes to at least 44x44px for mobile');
      }
      if (hasMobileHScroll) {
        improvements.push('Fix responsive layout to prevent horizontal scrolling');
      }
      if (mobileTextSizes.tooSmall > 0) {
        improvements.push('Increase minimum font size to 14px for mobile readability');
      }
    }
    
    improvements.push('Add loading skeletons for better UX during data fetching');
    improvements.push('Implement progressive enhancement for slower connections');
    improvements.push('Add aria-labels for better screen reader support');
    
    improvements.forEach(imp => console.log(`  • ${imp}`));

    // Save analysis report
    const report = {
      timestamp: new Date().toISOString(),
      issues,
      improvements,
      metrics,
      contrastIssues: contrastIssues.slice(0, 3),
      buttonAnalysis: {
        total: buttonAnalysis.total,
        tooSmall: buttonAnalysis.tooSmall.length,
        goodSize: buttonAnalysis.goodSize
      },
      mobileTextIssues: mobileTextSizes.tooSmall
    };
    
    await fs.writeFile('ui-analysis-report.json', JSON.stringify(report, null, 2));
    console.log('\n📊 Full report saved to: ui-analysis-report.json');

    await desktopContext.close();
    await mobileContext.close();

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  } finally {
    await browser.close();
  }

  return { issues, improvements };
}

// Run the analysis
console.log('════════════════════════════════════════════');
console.log('  UI/UX Analysis with Playwright');
console.log('════════════════════════════════════════════\n');

analyzeUI().then(result => {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Analysis Complete!');
  console.log('═══════════════════════════════════════════');
  console.log(`\n📋 Summary:`);
  console.log(`  - Issues found: ${result.issues.length}`);
  console.log(`  - Improvements suggested: ${result.improvements.length}`);
  console.log('\n✨ Check the screenshots and report for details.');
}).catch(console.error);