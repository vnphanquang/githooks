import * as path from 'jsr:@std/path/posix';
import { git } from '../src/git.ts';
import { initGit } from '../tests/utils.ts';
import { GITHOOKS_DIRNAME } from '../src/constants.ts';

export async function initDenoAndGit(cwd: string) {
	// deno init
	await new Deno.Command('deno', { args: ['init'] }).output();
	await initGit(cwd, true);
}

export async function commit(rootDir: string, message: string = 'test') {
	return await git(
		rootDir,
		'commit',
		'-m',
		message,
	).output();
}

/// HUSKY

export async function denoAddHusky(cwd: string, hook: boolean = false) {
	await new Deno.Command('deno', {
		args: ['add', 'npm:husky'],
	}).output();

	if (hook) {
		const huskyDirname = '.husky';
		await Deno.mkdir(path.join(cwd, huskyDirname), { recursive: true });
		await Deno.writeTextFile(path.join(cwd, huskyDirname, 'pre-commit'), 'echo "hello"');
	}
}

export async function huskyInit() {
	await new Deno.Command('deno', {
		args: ['run', '-A', '--cached-only', 'npm:husky'],
	}).output();
}

/// GITHOOKS

export async function denoAddGithooks(cwd: string, hook: boolean = false) {
	await new Deno.Command('deno', {
		args: ['add', 'jsr:@vnphanquang/githooks'],
	}).output();

	if (hook) {
		await Deno.mkdir(path.join(cwd, GITHOOKS_DIRNAME), { recursive: true });
		await Deno.writeTextFile(path.join(cwd, GITHOOKS_DIRNAME, 'pre-commit'), 'echo "hello"');
	}
}

export async function githooksInit() {
	await new Deno.Command('deno', {
		args: ['run', '-A', '--cached-only', 'jsr:@vnphanquang/githooks/bin', 'init'],
	}).output();
}

/// LEFTHOOK

export async function denoAddLefthook(cwd: string) {
	const leftHookConfigPath = path.join(cwd, 'lefthook.yml');

	const denoConfigPath = path.join(cwd, 'deno.json');
	const denoConfig = JSON.parse(await Deno.readTextFile(denoConfigPath));
	denoConfig['nodeModulesDir'] = 'auto';

	await Promise.all([
		// write
		Deno.writeTextFile(denoConfigPath, JSON.stringify(denoConfig, null, 2)),
		Deno.writeTextFile(
			leftHookConfigPath,
			`\
pre-commit:
  commands:
    hello:
      run: echo "hello"
`,
		),
	]);

	await new Deno.Command('deno', {
		args: ['add', '-A', '--allow-scripts', 'npm:lefthook'],
	}).output();
}

export async function lefthookInit() {
	await new Deno.Command('deno', {
		args: ['run', '-A', '--allow-scripts', '--cached-only', 'npm:lefthook', 'install'],
	}).output();
}
