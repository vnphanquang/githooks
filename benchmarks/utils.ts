import * as path from 'jsr:@std/path/posix';

import { sandbox as createSandbox } from 'jsr:@lambdalisue/sandbox';
import { git } from '../src/git.ts';

export async function sandbox(fn: () => void | Promise<void>) {
	const sbox = await createSandbox();
	try {
		await fn();
	} finally {
		await sbox[Symbol.asyncDispose]();
	}
}

export async function initDenoAndGit(cwd: string, gitConfig: boolean = false) {
	// deno init
	await Promise.all([
		new Deno.Command('deno', {
			args: ['init'],
		}).output(),
		// git init
		git(cwd, 'init').output(),
	]);

	// git config
	if (gitConfig) {
		await Promise.all([
			git(cwd, 'config', 'user.email', 'tester@example.com').output(),
			git(cwd, 'config', 'user.name', 'Deno Tester').output(),
			git(cwd, 'config', 'commit.gpgsign', 'false').output(),
		]);
	}
}

export async function writeAndStageCode(rootDir: string) {
	// write
	const sourcePath = path.join(rootDir, 'main.ts');
	await Deno.writeTextFile(sourcePath, 'console.log("hello")');

	// add
	await git(rootDir, 'add', sourcePath).output();
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
