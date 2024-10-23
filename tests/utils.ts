import * as path from 'jsr:@std/path/posix';
import { sandbox as createSandbox } from 'jsr:@lambdalisue/sandbox';
import { git } from '../src/git.ts';

/**
 * Create a sandbox and run the given function.
 * @param fn - the function to run in the sandbox.
 * @param cleanup - whether to cleanup the sandbox afterwards. For debugging only, if `false` expect error!
 */
export async function sandbox(fn: (cwd: string) => void | Promise<void>, cleanup: boolean = true) {
	const sbox = await createSandbox();
	try {
		await fn(sbox.path);
	} finally {
		if (!cleanup) {
			// deno-lint-ignore no-unsafe-finally
			throw new Error(`Skipping cleanup as specified. Temp directory is at ${sbox.path}`);
		}
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

export async function writeAndStageCode(rootDir: string, filename = 'main.ts') {
	// write
	const sourcePath = path.join(rootDir, filename);
	await Deno.writeTextFile(sourcePath, 'console.log("hello")');

	// add
	await git(rootDir, 'add', sourcePath).output();
}
