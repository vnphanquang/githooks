import { expect } from 'jsr:@std/expect';
import * as path from 'jsr:@std/path/posix';

import { sandbox } from 'jsr:@lambdalisue/sandbox';

import deno from '../deno.json' with { type: 'json' };
import { NotGitDirectoryError } from '../src/errors.ts';
import { GITHOOKS_UNDERSCORED_DIRNAME } from '../src/constants.ts';

if (!import.meta.dirname) throw Error('import.meta.dirname is not defined');
const localBinPath = path.join(import.meta.dirname, '../src/bin.ts');
const remoteBinPath = 'jsr:@vnphanquang/githooks/bin';

const textDecoder = new TextDecoder();

function githooks(localBinPath: string, ...args: string[]) {
	return new Deno.Command(Deno.execPath(), {
		args: ['-A', localBinPath, ...args],
	}).output();
}

async function expectCommonGithooksNoArgs(binPath: string) {
	const { success, stdout, code } = await githooks(binPath);
	expect(success).toBe(true);
	expect(code).toBe(0);

	const out = textDecoder.decode(stdout);
	expect(out).toContain(`Usage: ${deno.name}`);
}

Deno.test({
	name: 'run local "githooks" without any args',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await expectCommonGithooksNoArgs(localBinPath);
	},
});

Deno.test({
	name: 'run remote "githooks" without any args',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await expectCommonGithooksNoArgs(remoteBinPath);
	},
});

async function expectCommonGitHooksUnsupportedArgs(binPath: string) {
	const { success, stderr, code } = await githooks(binPath, 'unsupported');
	expect(success).toBe(false);
	expect(code).toBe(128);
	expect(textDecoder.decode(stderr)).toContain('"unsupported" command is not supported.');
}

Deno.test({
	name: 'run local "githooks" with unsupported command arg',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await expectCommonGitHooksUnsupportedArgs(localBinPath);
	},
});

Deno.test({
	name: 'run remote "githooks" with unsupported command arg',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await expectCommonGitHooksUnsupportedArgs(remoteBinPath);
	},
});

Deno.test({
	name: 'run local "githooks" with unsupported command arg',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			try {
				await githooks(localBinPath, 'init');
			} catch (err) {
				expect(err).toBeInstanceOf(NotGitDirectoryError);
			}

			await new Deno.Command('git', { args: ['init'] }).output();
			const { success } = await githooks(localBinPath, 'init');
			expect(success).toBe(true);
			const lstat = await Deno.lstat(path.join(Deno.cwd(), GITHOOKS_UNDERSCORED_DIRNAME));
			expect(lstat.isDirectory).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'run remote "githooks init"',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			try {
				await githooks(remoteBinPath, 'init');
			} catch (err) {
				expect(err).toBeInstanceOf(NotGitDirectoryError);
			}

			await new Deno.Command('git', { args: ['init'] }).output();
			const { success } = await githooks(remoteBinPath, 'init');
			expect(success).toBe(true);
			const lstat = await Deno.lstat(path.join(Deno.cwd(), GITHOOKS_UNDERSCORED_DIRNAME));
			expect(lstat.isDirectory).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});
