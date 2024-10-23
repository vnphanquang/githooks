import { expect } from 'jsr:@std/expect';
import * as path from 'jsr:@std/path';

import { initGit, sandbox } from './utils.ts';
import { GitHooksPathConfigError, NotGitDirectoryError } from '../src/errors.ts';
import { configureHooksPath, getGitRootDir } from '../src/git.ts';

Deno.test({
	name: 'Run getRootDir in non-git directory',
	permissions: {
		run: true,
		read: true,
		write: true,
	},
	async fn() {
		await sandbox(async (cwd) => {
			try {
				await getGitRootDir(cwd);
			} catch (err) {
				expect(err).toBeInstanceOf(NotGitDirectoryError);
			}
		});
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
		await sandbox(async (cwd) => {
			await initGit(cwd);
			const gitRootDir = await getGitRootDir(Deno.cwd());
			expect(path.toFileUrl(gitRootDir).toString()).toBe(path.toFileUrl(Deno.cwd()).toString());
		});
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
		await sandbox(async (cwd) => {
			try {
				await configureHooksPath(cwd, '.git/hooks');
			} catch (err) {
				expect(err).toBeInstanceOf(GitHooksPathConfigError);
			}
		});
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
		await sandbox(async (cwd) => {
			await initGit(cwd);
			await configureHooksPath(cwd, '.git/hooks');
		});
	},
});
