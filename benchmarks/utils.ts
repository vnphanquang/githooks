import { git } from '../src/git.ts';
import { initGit } from '../tests/utils.ts';

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

export async function denoAddHusky() {
	await new Deno.Command('deno', {
		args: ['add', 'npm:husky'],
	}).output();
}

export async function huskyInit() {
	await new Deno.Command('deno', {
		args: ['-A', 'run', 'npm:husky', '--cached-only'],
	}).output();
}

/// GITHOOKS

export async function denoAddGithooks() {
	await new Deno.Command('deno', {
		args: ['add', 'jsr:@vnphanquang/githooks'],
	}).output();
}

export async function githooksInit() {
	await new Deno.Command('deno', {
		args: ['-A', 'run', 'jsr:@vnphanquang/githooks', '--cached-only'],
	}).output();
}
