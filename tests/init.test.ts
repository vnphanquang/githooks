import { expect } from 'jsr:@std/expect';
import * as path from 'jsr:@std/path/posix';
import { stub } from 'jsr:@std/testing/mock';

import { sandbox } from 'jsr:@lambdalisue/sandbox';

import { GIT_HOOKS, GITHOOKS_DIRNAME, GITHOOKS_UNDERSCORED_DIRNAME } from '../src/constants.ts';
import { NotGitDirectoryError } from '../src/errors.ts';
import { init } from '../src/init.ts';
import { git } from '../src/git.ts';
import { GITHOOKS_SCRIPT_NAME } from '../src/constants.ts';

Deno.test({
	name: 'run "init" in non-git directory',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			await init();
		} catch (err) {
			expect(err).toBeInstanceOf(NotGitDirectoryError);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

async function expectCommonGitInit(cwd: string = Deno.cwd(), config = false) {
	let { success } = await git(cwd, 'init').output();
	expect(success).toBe(true);

	if (config) {
		// configure git user
		({ success } = await git(cwd, 'config', 'user.email', 'tester@example.com').output());
		expect(success).toBe(true);
		({ success } = await git(cwd, 'config', 'user.name', 'Deno Tester').output());
		expect(success).toBe(true);

		// skip gpg sign
		({ success } = await git(cwd, 'config', 'commit.gpgsign', 'false').output());
		expect(success).toBe(true);
	}
}

const PRE_COMMIT_PATH = path.join(GITHOOKS_DIRNAME, 'pre-commit');
const GITIGNORE_PATH = path.join(GITHOOKS_UNDERSCORED_DIRNAME, '.gitignore');
const GENERAGED_FILES = [
	GITIGNORE_PATH,
	PRE_COMMIT_PATH,
	...GIT_HOOKS.map((hook) => path.join(GITHOOKS_UNDERSCORED_DIRNAME, hook)),
];
async function expectCommonInit(gitRootDir: string, initFn: typeof init = init) {
	await initFn();

	for (const file of GENERAGED_FILES) {
		const lstat = await Deno.lstat(path.join(gitRootDir, file));
		expect(lstat.isFile).toBe(true);
		if (file !== GITIGNORE_PATH && Deno.build.os !== 'windows') {
			expect(lstat.mode).not.toBeNull();
			expect((lstat.mode ?? 0) & 0o777).toBe(0o755);
		}
	}
}

Deno.test({
	name: 'run "githooks init" in git directory',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			await expectCommonGitInit();
			const rootDir = Deno.cwd();
			await expectCommonInit(rootDir);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'run "init" in git directory, but at sub-directory',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			await expectCommonGitInit();

			const rootDir = Deno.cwd();
			await Deno.mkdir('subdir');
			Deno.chdir('subdir');

			await expectCommonInit(rootDir);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'run "init" in git directory, multiple times',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			await expectCommonGitInit();
			await init();

			const preCommitContent = 'echo "hello"';
			const rootDir = Deno.cwd();
			await Deno.writeTextFile(
				path.join(rootDir, PRE_COMMIT_PATH),
				preCommitContent,
			);

			await init();

			const preCommitFileContent = await Deno.readTextFile(path.join(rootDir, PRE_COMMIT_PATH));
			expect(preCommitFileContent).toBe(preCommitContent);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'run "init" in git directory, Deno.mkdir throws error',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		const errorMessage = 'some mkdir error';
		const stubbed = stub(Deno, 'mkdir', () => {
			throw new Error(errorMessage);
		});
		try {
			await expectCommonGitInit();
			await init();
		} catch (err) {
			expect((err as Error).message).toBe(errorMessage);
		} finally {
			await sbox[Symbol.asyncDispose]();
			stubbed.restore();
		}
	},
});

Deno.test({
	name: 'run "init" in git directory, Deno.lstat throws error',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		const errorMessage = 'some lstat error';
		const stubbed = stub(Deno, 'lstat', () => {
			throw new Error(errorMessage);
		});
		try {
			await expectCommonGitInit();
			await init();
		} catch (err) {
			expect((err as Error).message).toBe(errorMessage);
		} finally {
			await sbox[Symbol.asyncDispose]();
			stubbed.restore();
		}
	},
});

async function expectCommonCommit() {
	// write
	await Deno.writeTextFile('main.ts', 'console.log("hello")');

	// add
	const { success } = await git(Deno.cwd(), 'add', 'main.ts').output();
	expect(success).toBe(true);

	// commit
	return await git(
		Deno.cwd(),
		'commit',
		'-m',
		'test pre-commit hook',
	).output();
}

Deno.test({
	name: 'git commit should trigger pre-commit hook',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			await expectCommonGitInit(Deno.cwd(), true);
			await expectCommonInit(Deno.cwd());

			const { success, stderr } = await expectCommonCommit();
			expect(new TextDecoder().decode(stderr)).toContain('Checked 1 file');
			expect(success).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'GITHOOKS=0 should skip hook',
	permissions: {
		read: true,
		write: true,
		run: true,
		env: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			await expectCommonGitInit(Deno.cwd(), true);
			await expectCommonInit(Deno.cwd());

			Deno.env.set('GITHOOKS', '0');
			const { success, stderr } = await expectCommonCommit();
			expect(new TextDecoder().decode(stderr)).not.toContain('Checked 1 file');
			expect(success).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
			Deno.env.delete('GITHOOKS');
		}
	},
});

Deno.test({
	name: 'unset GITHOOKS_CURRENT_HOOK should warn user',
	permissions: {
		read: true,
		write: true,
		run: true,
		env: true,
	},
	async fn() {
		await using sbox = await sandbox();

		try {
			await expectCommonGitInit(Deno.cwd(), true);
			await expectCommonInit(Deno.cwd());

			await Deno.writeTextFile('main.ts', 'console.log("hello")');

			// overwrite pre-commit
			const script = `\
#!/usr/bin/env sh
. "$(dirname "$0")/${GITHOOKS_SCRIPT_NAME}" $@
`;
			await Deno.writeTextFile(
				path.join(Deno.cwd(), GITHOOKS_UNDERSCORED_DIRNAME, 'pre-commit'),
				script,
			);

			const { success, stderr } = await expectCommonCommit();
			const err = new TextDecoder().decode(stderr);
			expect(err).toContain('Checked 1 file');
			expect(err).toContain(
				'unset GITHOOKS_CURRENT_HOOK. Hook may not function properly.',
			);
			expect(success).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
		}
	},
});

Deno.test({
	name: 'respect global init script from XDG_CONFIG_HOME env',
	permissions: {
		read: true,
		write: true,
		run: true,
		env: true,
	},
	async fn() {
		await using sbox = await sandbox();
		const xdgConfigHome = Deno.env.get('XDG_CONFIG_HOME');
		try {
			const cwd = Deno.cwd();
			await expectCommonGitInit(cwd, true);
			await expectCommonInit(cwd);

			const configPath = path.join(cwd, '.config');
			Deno.env.set('XDG_CONFIG_HOME', configPath);
			await Deno.mkdir(path.join(configPath, 'githooks'), { recursive: true });

			const initScript = '\
				#!/usr/bin/env sh\n\
				export GITHOOKS=0\n\
				echo "Current hook is $GITHOOKS_CURRENT_HOOK"\n\
			';
			await Deno.writeTextFile(path.join(configPath, 'githooks/init'), initScript);
			const { success, stderr } = await expectCommonCommit();
			const err = new TextDecoder().decode(stderr);
			expect(err).not.toContain('Checked 1 file');
			expect(err).toContain('Current hook is pre-commit');
			expect(success).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
			if (xdgConfigHome) {
				Deno.env.set('XDG_CONFIG_HOME', xdgConfigHome);
			} else {
				Deno.env.delete('XDG_CONFIG_HOME');
			}
		}
	},
});

Deno.test({
	name: 'respect GITHOOKS=2 (debug mode)',
	permissions: {
		read: true,
		write: true,
		run: true,
		env: true,
	},
	async fn() {
		await using sbox = await sandbox();
		const gitHooksEnv = Deno.env.get('GITHOOKS');
		try {
			const cwd = Deno.cwd();
			await expectCommonGitInit(cwd, true);
			await expectCommonInit(cwd);

			Deno.env.set('GITHOOKS', '2');

			const { success, stderr } = await expectCommonCommit();
			const err = new TextDecoder().decode(stderr);
			expect(err).toContain('Checked 1 file');
			expect(err).toContain(`sh -e`);
			expect(success).toBe(true);
		} finally {
			await sbox[Symbol.asyncDispose]();
			if (gitHooksEnv) {
				Deno.env.set('XDG_CONFIG_HOME', gitHooksEnv);
			} else {
				Deno.env.delete('XDG_CONFIG_HOME');
			}
		}
	},
});
