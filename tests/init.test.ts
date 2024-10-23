import { expect } from 'jsr:@std/expect';
import * as path from 'jsr:@std/path/posix';
import { stub } from 'jsr:@std/testing/mock';

import { initGit, sandbox } from './utils.ts';
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
		await sandbox(async () => {
			try {
				await init();
			} catch (err) {
				expect(err).toBeInstanceOf(NotGitDirectoryError);
				if (!(err instanceof NotGitDirectoryError)) {
					throw err;
				}
			}
		});
	},
});

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
		await sandbox(async (cwd) => {
			await initGit(cwd);
			await expectCommonInit(cwd);
		});
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
		await sandbox(async (cwd) => {
			await initGit(cwd);
			await Deno.mkdir('subdir');
			Deno.chdir('subdir');
			await expectCommonInit(cwd);
		});
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
		await sandbox(async (rootDir) => {
			await initGit(rootDir);
			await init();

			const preCommitContent = 'echo "hello"';
			await Deno.writeTextFile(
				path.join(rootDir, PRE_COMMIT_PATH),
				preCommitContent,
			);

			await init();

			const preCommitFileContent = await Deno.readTextFile(path.join(rootDir, PRE_COMMIT_PATH));
			expect(preCommitFileContent).toBe(preCommitContent);
		});
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
		await sandbox(async (cwd) => {
			const errorMessage = 'some mkdir error';
			const stubbed = stub(Deno, 'mkdir', () => {
				throw new Error(errorMessage);
			});
			try {
				await initGit(cwd);
				await init();
			} catch (err) {
				const message = (err as Error).message;
				expect(message).toBe(errorMessage);
				if (message !== errorMessage) {
					throw err;
				}
			} finally {
				stubbed.restore();
			}
		});
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
		await sandbox(async (cwd) => {
			const errorMessage = 'some lstat error';
			const stubbed = stub(Deno, 'lstat', () => {
				throw new Error(errorMessage);
			});

			try {
				await initGit(cwd);
				await init();
			} catch (err) {
				const message = (err as Error).message;
				expect(message).toBe(errorMessage);
				if (message !== errorMessage) {
					throw err;
				}
			} finally {
				stubbed.restore();
			}
		});
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
		await sandbox(async (cwd) => {
			await initGit(cwd, true);
			await expectCommonInit(Deno.cwd());

			const { success, stderr } = await expectCommonCommit();
			expect(new TextDecoder().decode(stderr)).toContain('Checked 1 file');
			expect(success).toBe(true);
		});
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
		await sandbox(async (cwd) => {
			try {
				await initGit(cwd, true);
				await expectCommonInit(Deno.cwd());

				Deno.env.set('GITHOOKS', '0');
				const { success, stderr } = await expectCommonCommit();
				expect(new TextDecoder().decode(stderr)).not.toContain('Checked 1 file');
				expect(success).toBe(true);
			} finally {
				Deno.env.delete('GITHOOKS');
			}
		});
	},
});

Deno.test({
	name: 'unset GITHOOKS_TRIGGER should warn user',
	permissions: {
		read: true,
		write: true,
		run: true,
		env: true,
	},
	async fn() {
		await sandbox(async (cwd) => {
			await initGit(cwd, true);
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
				'unset GITHOOKS_TRIGGER. Hook may not function properly.',
			);
			expect(success).toBe(true);
		});
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
		await sandbox(async (cwd) => {
			const gitHooksEnv = Deno.env.get('GITHOOKS');
			try {
				await initGit(cwd, true);
				await expectCommonInit(cwd);

				Deno.env.set('GITHOOKS', '2');

				const { success, stderr } = await expectCommonCommit();
				const err = new TextDecoder().decode(stderr);
				expect(err).toContain('Checked 1 file');
				expect(err).toContain(`sh -e`);
				expect(success).toBe(true);
			} finally {
				if (gitHooksEnv) {
					Deno.env.set('XDG_CONFIG_HOME', gitHooksEnv);
				} else {
					Deno.env.delete('XDG_CONFIG_HOME');
				}
			}
		});
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
		await sandbox(async (cwd) => {
			const xdgConfigHome = Deno.env.get('XDG_CONFIG_HOME');
			try {
				await initGit(cwd, true);
				await expectCommonInit(cwd);

				const configPath = path.join(cwd, '.config');
				Deno.env.set('XDG_CONFIG_HOME', configPath);
				await Deno.mkdir(path.join(configPath, 'githooks'), { recursive: true });

				const initScript = '\
				#!/usr/bin/env sh\n\
				export GITHOOKS=0\n\
				echo "Current hook is $GITHOOKS_TRIGGER"\n\
			';
				await Deno.writeTextFile(path.join(configPath, 'githooks/init'), initScript);
				const { success, stderr } = await expectCommonCommit();
				const err = new TextDecoder().decode(stderr);
				expect(err).not.toContain('Checked 1 file');
				expect(err).toContain('Current hook is pre-commit');
				expect(success).toBe(true);
			} finally {
				if (xdgConfigHome) {
					Deno.env.set('XDG_CONFIG_HOME', xdgConfigHome);
				} else {
					Deno.env.delete('XDG_CONFIG_HOME');
				}
			}
		});
	},
});

if (Deno.env.get('CI') === 'true') {
	// only run in CI to avoid interference
	// with user's ~/.config/githooks/init
	Deno.test({
		name: 'respect global init script from home directory',
		permissions: {
			read: true,
			write: true,
			run: true,
			env: true,
		},
		async fn() {
			await sandbox(async (cwd) => {
				let initialInitScript: string | null = null;
				let homePath = Deno.env.get('HOME');
				if (!homePath && Deno.build.os === 'windows') {
					homePath = Deno.env.get('USERPROFILE');
				}
				const initScriptPath = path.join(homePath ?? '~/.config', '.config/githooks/init');
				try {
					initialInitScript = await Deno.readTextFile(initScriptPath);
				} catch (err) {
					if (!(err instanceof Deno.errors.NotFound)) {
						throw err;
					}
				}

				try {
					await initGit(cwd, true);
					await expectCommonInit(cwd);

					try {
						await Deno.mkdir(path.dirname(initScriptPath), { recursive: true });
					} catch (err) {
						if (!(err instanceof Deno.errors.AlreadyExists)) {
							throw err;
						}
					}
					const initScript = '\
						#!/usr/bin/env sh\n\
						export GITHOOKS=0\n\
						echo "Current hook is $GITHOOKS_TRIGGER"\n\
						';
					await Deno.writeTextFile(initScriptPath, initScript);

					const { success, stderr } = await expectCommonCommit();
					const err = new TextDecoder().decode(stderr);
					expect(err).not.toContain('Checked 1 file');
					expect(err).toContain('Current hook is pre-commit');
					expect(success).toBe(true);
				} finally {
					if (initialInitScript) {
						await Deno.writeTextFile(initScriptPath, initialInitScript);
					} else {
						await Deno.remove(initScriptPath);
					}
				}
			});
		},
	});
}
