#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import detectPort from 'detect-port';
import open from 'open';
import chalk from 'chalk';
import { startServer } from './server.js';

const program = new Command();

program
  .name('stickstack')
  .description('Turn PRD markdown files into visual roadmaps and execute tasks via Claude Code')
  .version('1.0.0')
  .option('-p, --port <number>', 'Port to run the server on', '3001')
  .option('--no-open', 'Do not open browser automatically')
  .parse(process.argv);

const options = program.opts();

async function checkClaudeCLI(): Promise<boolean> {
  try {
    execSync('claude --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log(chalk.bold('\n  StickStack\n'));

  // Check for Claude CLI
  const hasClaudeCLI = await checkClaudeCLI();
  if (!hasClaudeCLI) {
    console.log(chalk.yellow('  Warning: Claude CLI not found.'));
    console.log(chalk.gray('  Task execution will not work without it.'));
    console.log(chalk.gray('  Install: npm install -g @anthropic-ai/claude-code\n'));
  } else {
    console.log(chalk.green('  Claude CLI found'));
  }

  // Find available port
  const requestedPort = parseInt(options.port, 10);
  const availablePort = await detectPort(requestedPort);

  if (availablePort !== requestedPort) {
    console.log(chalk.yellow(`  Port ${requestedPort} is in use, using ${availablePort}`));
  }

  // Start server
  const server = await startServer(availablePort);

  const url = `http://localhost:${availablePort}`;
  console.log(chalk.green(`  Server running at ${chalk.bold(url)}`));
  console.log(chalk.gray(`  Database: ${process.cwd()}/.stickstack/kanban.db\n`));

  // Open browser
  if (options.open !== false) {
    console.log(chalk.gray('  Opening browser...'));
    await open(url);
  }

  console.log(chalk.gray('  Press Ctrl+C to stop\n'));

  // Graceful shutdown
  const shutdown = (): void => {
    console.log(chalk.gray('\n  Shutting down...'));
    server.close(() => {
      console.log(chalk.green('  Server stopped'));
      process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
      console.log(chalk.yellow('  Forcing shutdown...'));
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});
