// MCP Server Test Script
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Testing MCP Server Functionality\n");

// Test 1: Check Node.js version
console.log("1. Node.js Version:", process.version);

// Test 2: Verify local MCP servers exist
const servers = [
    { name: 'WSL-Deployment', path: './WSL-Deployment-Sequential-Thinking/dist/index.js' },
    { name: 'Context7', path: './context7/package.json' },
    { name: 'Playwright', path: './playwright-mcp/package.json' }
];

console.log("\n2. MCP Server Files Check:");
servers.forEach(server => {
    const exists = fs.existsSync(path.join(__dirname, server.path));
    console.log(`   - ${server.name}: ${exists ? '✓ Found' : '✗ Not found'}`);
});

// Test 3: Check global npm packages
console.log("\n3. Global NPM Packages for MCP:");

try {
    const globalPackages = execSync('npm list -g --depth=0', { encoding: 'utf-8' });
    const mcpPackages = globalPackages.split('\n').filter(line => 
        line.includes('@modelcontextprotocol') || 
        line.includes('@upstash/context7') ||
        line.includes('@playwright/mcp')
    );
    
    if (mcpPackages.length > 0) {
        mcpPackages.forEach(pkg => console.log(`   ${pkg.trim()}`));
    } else {
        console.log("   No global MCP packages found");
    }
} catch (error) {
    console.log("   Error checking global packages");
}

console.log("\n✅ MCP Server Test Complete");