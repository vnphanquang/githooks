import * as path from 'jsr:@std/path/posix';
import { sandbox as createSandbox } from 'jsr:@lambdalisue/sandbox';
import { git } from '../src/git.ts';

export async function sandbox(fn: (cwd: string) => void | Promise<void>) {
	const sbox = await createSandbox();
	try {
		await fn(sbox.path);
	} finally {
		await sbox[Symbol.asyncDispose]();
	}
}

export async function initGit(cwd: string, config: boolean = false) {
	// git init
	await git(cwd, 'init').output();

	// git config
	if (config) {
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
