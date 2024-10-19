import { expect } from 'jsr:@std/expect';
import * as pathPosix from 'jsr:@std/path/posix';
import * as pathWindows from 'jsr:@std/path/windows';

import { sandbox } from 'jsr:@lambdalisue/sandbox';

import deno from '../deno.json' with { type: 'json' };
import { NotGitDirectoryError } from '../src/errors.ts';
import { GITHOOKS_UNDERSCORED_DIRNAME } from '../src/constants.ts';

if (!import.meta.dirname) throw Error('import.meta.dirname is not defined');
let localBinPath = pathPosix.join(import.meta.dirname, '../src/bin.ts');
if (Deno.build.os === 'windows') {
	localBinPath = pathWindows.join(import.meta.dirname, '../src/bin.ts').replaceAll('/', '\\');
}
const remoteBinPath = 'jsr:@vnphanquang/githooks/bin';

const textDecoder = new TextDecoder();

function githooks(localBinPath: string, ...args: string[]) {
	return new Deno.Command(Deno.execPath(), {
		args: ['-A', localBinPath, ...args],
	}).output();
}

async function expectCommonGithooksNoArgs(binPath: string) {
	const { success, stdout, code } = await githooks(binPath);
	expect(textDecoder.decode(stdout)).toContain(`Usage: ${deno.name}`);
	expect(code).toBe(0);
	expect(success).toBe(true);
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
	expect(textDecoder.decode(stderr)).toContain('"unsupported" command is not supported.');
	expect(code).toBe(128);
	expect(success).toBe(false);
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
	name: 'run local "githooks init"',
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
			const { success, stderr } = await githooks(localBinPath, 'init');
			if (!success) throw new Error(textDecoder.decode(stderr));
			const lstat = await Deno.lstat(pathPosix.join(Deno.cwd(), GITHOOKS_UNDERSCORED_DIRNAME));
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
			const { success, stderr } = await githooks(remoteBinPath, 'init');
			if (!success) throw new Error(textDecoder.decode(stderr));
			const lstat = await Deno.lstat(pathPosix.join(Deno.cwd(), GITHOOKS_UNDERSCORED_DIRNAME));
			expect(lstat.isDirectory).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});
