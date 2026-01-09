#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const args = process.argv.slice(2);
const command = args[0];

const COMMANDS_DIR = path.join(__dirname, '..', '.claude', 'commands');
const RULES_DIR = path.join(__dirname, '..', 'docs', 'rules');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const CLAUDE_MD = path.join(__dirname, '..', 'CLAUDE.md');
const REPO_URL = 'https://github.com/chirag1507/cd-agent.git';

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

function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getRemoteUrl() {
  try {
    const url = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    return url;
  } catch {
    return null;
  }
}

function fetchFromBranch(branch, targetDir) {
  const tempDir = path.join(require('os').tmpdir(), `cd-agent-${Date.now()}`);

  try {
    console.log(`\n🔄 Fetching files from branch: ${branch}\n`);

    // Check if we're in the cd-agent repo locally
    const isLocal = isGitRepo() && getRemoteUrl()?.includes('cd-agent');

    if (isLocal) {
      // Use local git repo
      console.log('✓ Using local cd-agent repository');
      const repoRoot = path.join(__dirname, '..');

      // Check if branch exists
      try {
        execSync(`git rev-parse --verify ${branch}`, { cwd: repoRoot, stdio: 'ignore' });
      } catch {
        console.error(`✗ Branch "${branch}" not found in local repository`);
        process.exit(1);
      }

      // Export files from specific branch to temp directory
      fs.mkdirSync(tempDir, { recursive: true });
      execSync(`git archive ${branch} | tar -x -C ${tempDir}`, { cwd: repoRoot });

    } else {
      // Clone from GitHub
      console.log('✓ Cloning from GitHub repository');
      execSync(`git clone --depth 1 --branch ${branch} ${REPO_URL} ${tempDir}`, {
        stdio: 'inherit'
      });
    }

    return {
      commandsDir: path.join(tempDir, '.claude', 'commands'),
      rulesDir: path.join(tempDir, 'docs', 'rules'),
      docsDir: path.join(tempDir, 'docs'),
      claudeMd: path.join(tempDir, 'CLAUDE.md'),
      cleanup: () => {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    };

  } catch (error) {
    console.error(`✗ Failed to fetch from branch "${branch}": ${error.message}`);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

function question(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}

async function promptForBranch() {
  console.log('\n📦 CD-Agent Branch Selection\n');

  const useBranch = await question('Do you want to use a specific branch? (y/N): ');

  if (useBranch.toLowerCase() === 'y' || useBranch.toLowerCase() === 'yes') {
    console.log('\nAvailable options:');
    console.log('  - main (stable release)');
    console.log('  - refactor/on-demand-rule-loading (workflow checkpoints + context optimization)');
    console.log('  - Or enter any other branch name\n');

    const branch = await question('Enter branch name (or press Enter for "main"): ');
    return branch.trim() || 'main';
  }

  return null;
}

function printHelp() {
  console.log(`
CD-Agent - XP/CD Development Commands for Claude Code

Usage:
  npx @avesta/cd-agent <command> [options]

Commands:
  init              Copy commands and rules to current project (interactive)
  init --with-claude-md         Also copy CLAUDE.md template
  init --branch <branch-name>   Copy files from specific branch (non-interactive)

Options:
  --branch <name>   Fetch files from a specific branch (e.g., refactor/on-demand-rule-loading)
  --with-claude-md  Include CLAUDE.md template
  --force           Overwrite existing files
  --no-prompt       Skip interactive prompts (use defaults)

Examples:
  cd my-project
  npx @avesta/cd-agent init                    # Interactive (will ask for branch)
  npx @avesta/cd-agent init --with-claude-md   # Interactive with CLAUDE.md
  npx @avesta/cd-agent init --branch refactor/on-demand-rule-loading --with-claude-md  # Non-interactive
  npx @avesta/cd-agent init --no-prompt        # Non-interactive (use main branch)

Branch-specific usage:
  Use --branch to test features from development branches before they're released.
  If running from the cd-agent repo locally, it will use local branches.
  Otherwise, it will clone from GitHub.

After initialization:
  1. Customize CLAUDE.md for your project
  2. Start Claude Code in your project
  3. Run /plan <your first feature>

Documentation:
  https://github.com/chirag1507/cd-agent
`);
}

function init(options = {}) {
  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');
  const commandsTarget = path.join(claudeDir, 'commands');
  const rulesTarget = path.join(targetDir, 'docs', 'rules');

  console.log('\n🚀 CD-Agent Initialization\n');
  console.log(`Target: ${targetDir}\n`);

  // Determine source directories
  let sourcePaths;
  let cleanup = null;

  if (options.branch) {
    // Fetch from specific branch
    const branchData = fetchFromBranch(options.branch, targetDir);
    sourcePaths = {
      commandsDir: branchData.commandsDir,
      rulesDir: branchData.rulesDir,
      docsDir: branchData.docsDir,
      claudeMd: branchData.claudeMd
    };
    cleanup = branchData.cleanup;
  } else {
    // Use default local paths
    sourcePaths = {
      commandsDir: COMMANDS_DIR,
      rulesDir: RULES_DIR,
      docsDir: DOCS_DIR,
      claudeMd: CLAUDE_MD
    };
  }

  try {
    // Create .claude directory
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
      console.log('✓ Created .claude/ directory');
    }

    // Copy commands
    if (fs.existsSync(sourcePaths.commandsDir)) {
      copyDir(sourcePaths.commandsDir, commandsTarget);
      const commandCount = fs.readdirSync(sourcePaths.commandsDir).filter(f => f.endsWith('.md')).length;
      console.log(`✓ Copied ${commandCount} commands to .claude/commands/`);
    } else {
      console.error('✗ Commands directory not found');
      process.exit(1);
    }

    // Copy rules
    if (fs.existsSync(sourcePaths.rulesDir)) {
      copyDir(sourcePaths.rulesDir, rulesTarget);
      const ruleCount = fs.readdirSync(sourcePaths.rulesDir).filter(f => f.endsWith('.md')).length;
      console.log(`✓ Copied ${ruleCount} rules to docs/rules/`);
    } else {
      console.error('✗ Rules directory not found');
      process.exit(1);
    }

    // Copy workflow-flowchart.md from docs directory
    const workflowFile = path.join(sourcePaths.docsDir, 'workflow-flowchart.md');
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
      } else if (fs.existsSync(sourcePaths.claudeMd)) {
        fs.copyFileSync(sourcePaths.claudeMd, claudeMdTarget);
        console.log('✓ Copied CLAUDE.md template');
      }
    }
  } finally {
    // Cleanup temp directory if using branch
    if (cleanup) {
      cleanup();
    }
  }

  console.log(`
═══════════════════════════════════════════════════════
  CD-Agent installed successfully!${options.branch ? ` (branch: ${options.branch})` : ''}
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

// Helper to extract flag value
function getFlagValue(flagName) {
  const flagIndex = args.indexOf(flagName);
  if (flagIndex !== -1 && flagIndex + 1 < args.length) {
    return args[flagIndex + 1];
  }
  return null;
}

// Main
(async () => {
  switch (command) {
    case 'init': {
      let branchValue = getFlagValue('--branch');
      const noPrompt = args.includes('--no-prompt');

      // If no branch specified and prompting is allowed, ask interactively
      if (!branchValue && !noPrompt) {
        branchValue = await promptForBranch();
      }

      init({
        withClaudeMd: args.includes('--with-claude-md'),
        force: args.includes('--force'),
        branch: branchValue,
      });
      break;
    }
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
})();
