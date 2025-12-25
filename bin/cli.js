#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

const COMMANDS_DIR = path.join(__dirname, '..', '.claude', 'commands');
const RULES_DIR = path.join(__dirname, '..', '.claude', 'rules');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const CLAUDE_MD = path.join(__dirname, '..', 'CLAUDE.md');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function printHelp() {
  console.log(`
CD-Agent - XP/CD Development Commands for Claude Code

Usage:
  npx @avesta/cd-agent <command>

Commands:
  init              Copy commands and rules to current project
  init --with-claude-md   Also copy CLAUDE.md template

Examples:
  cd my-project
  npx @avesta/cd-agent init
  npx @avesta/cd-agent init --with-claude-md

After initialization:
  1. Customize CLAUDE.md for your project
  2. Use /plan to break down your first feature
  3. Use /red to start TDD

Documentation:
  https://github.com/chirag1507/cd-agent
`);
}

function init(options = {}) {
  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');
  const commandsTarget = path.join(claudeDir, 'commands');
  const rulesTarget = path.join(claudeDir, 'rules');

  console.log('\n🚀 CD-Agent Initialization\n');
  console.log(`Target: ${targetDir}\n`);

  // Create .claude directory
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
    console.log('✓ Created .claude/ directory');
  }

  // Copy commands
  if (fs.existsSync(COMMANDS_DIR)) {
    copyDir(COMMANDS_DIR, commandsTarget);
    const commandCount = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md')).length;
    console.log(`✓ Copied ${commandCount} commands to .claude/commands/`);
  } else {
    console.error('✗ Commands directory not found');
    process.exit(1);
  }

  // Copy rules
  if (fs.existsSync(RULES_DIR)) {
    copyDir(RULES_DIR, rulesTarget);
    const ruleCount = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.md')).length;
    console.log(`✓ Copied ${ruleCount} rules to .claude/rules/`);
  } else {
    console.error('✗ Rules directory not found');
    process.exit(1);
  }

  // Copy workflow-flowchart.md from docs directory
  const workflowFile = path.join(DOCS_DIR, 'workflow-flowchart.md');
  if (fs.existsSync(workflowFile)) {
    const docsTarget = path.join(targetDir, 'docs');
    if (!fs.existsSync(docsTarget)) {
      fs.mkdirSync(docsTarget, { recursive: true });
    }
    const workflowTarget = path.join(docsTarget, 'workflow-flowchart.md');
    fs.copyFileSync(workflowFile, workflowTarget);
    console.log('✓ Copied workflow-flowchart.md to docs/');
  } else {
    console.log('⚠ workflow-flowchart.md not found, skipping');
  }

  // Copy CLAUDE.md if requested
  if (options.withClaudeMd) {
    const claudeMdTarget = path.join(targetDir, 'CLAUDE.md');
    if (fs.existsSync(claudeMdTarget)) {
      console.log('⚠ CLAUDE.md already exists, skipping (use --force to overwrite)');
    } else if (fs.existsSync(CLAUDE_MD)) {
      fs.copyFileSync(CLAUDE_MD, claudeMdTarget);
      console.log('✓ Copied CLAUDE.md template');
    }
  }

  console.log(`
═══════════════════════════════════════════════════════
  CD-Agent installed successfully!
═══════════════════════════════════════════════════════

Available commands:
  /plan <feature>         Plan with Example Mapping
  /red <behavior>         Write failing test
  /green                  Make test pass
  /refactor               Improve code structure
  /cycle <behavior>       Full TDD cycle
  /acceptance-test        Write executable specification
  /commit                 Conventional commit
  /ship                   Merge to main

Next steps:
  1. ${options.withClaudeMd ? 'Customize CLAUDE.md for your domain' : 'Copy and customize CLAUDE.md: npx @avesta/cd-agent init --with-claude-md'}
  2. Start Claude Code in your project
  3. Run /plan <your first feature>

Documentation: https://github.com/chirag1507/cd-agent
`);
}

// Main
switch (command) {
  case 'init':
    init({
      withClaudeMd: args.includes('--with-claude-md'),
      force: args.includes('--force'),
    });
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
