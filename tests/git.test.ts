import { expect } from 'jsr:@std/expect';

import { sandbox } from 'jsr:@lambdalisue/sandbox';

import { GitHooksPathConfigError, NotGitDirectoryError } from '../src/errors.ts';
import { configureHooksPath, getGitRootDir } from '../src/git.ts';

async function expectCommonGitInit() {
	const { success: gitInitSuccess } = await new Deno.Command('git', {
		args: ['init'],
	}).output();
	expect(gitInitSuccess).toBe(true);
}

Deno.test({
	name: 'Run getRootDir in non-git directory',
	permissions: {
		run: true,
		read: true,
		write: true,
	},
	async fn() {
		await using sbox = await sandbox();
		try {
			await getGitRootDir(Deno.cwd());
		} catch (err) {
			expect(err).toBeInstanceOf(NotGitDirectoryError);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'Run getRootDir in git directory',
	permissions: {
		run: true,
		read: true,
		write: true,
	},
	async fn() {
		await using sbox = await sandbox();
		try {
			await expectCommonGitInit();
			const gitRootDir = await getGitRootDir(Deno.cwd());
			expect(gitRootDir).toBe(Deno.cwd());
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'Run configureHooksPath in non-git directory',
	permissions: {
		run: true,
		read: true,
		write: true,
	},
	async fn() {
		await using sbox = await sandbox();
		try {
			await configureHooksPath(Deno.cwd(), '.git/hooks');
		} catch (err) {
			expect(err).toBeInstanceOf(GitHooksPathConfigError);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'Run configureHooksPath in git directory',
	permissions: {
		run: true,
		read: true,
		write: true,
	},
	async fn() {
		await using sbox = await sandbox();
		try {
			await expectCommonGitInit();
			await configureHooksPath(Deno.cwd(), '.git/hooks');
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});
