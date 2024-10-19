import { join } from 'jsr:@std/path@1/posix';

import {
	GIT_HOOKS,
	GITHOOKS_DIRNAME,
	GITHOOKS_SCRIPT,
	GITHOOKS_SCRIPT_NAME,
	GITHOOKS_UNDERSCORED_DIRNAME,
} from './constants.ts';
import { configureHooksPath, getGitRootDir } from './git.ts';

/**
 * Set up the following:
 *
 * 1. `.githooks/pre-commit`: the pre-commit git hook that runs `deno lint`
 * 2. `.githooks/_/`: internals for running hooks. Can safely be ignored
 *
 * @example Run `init` programmatically:
 * ```ts
 * import { init } from 'jsr:@vnphanquang/githooks';
 *
 * await import(Deno.cwd())
 * ```
 *
 * @example Run `init` from the command line:
 * ```sh
 * deno run -A jsr:@vnphanquang/githooks init
 * ```
 *
 * @param cwd - Current working directory
 */
export async function init(cwd: string = Deno.cwd()) {
	const gitRootDir = await getGitRootDir(cwd);
	const hooksDir = join(gitRootDir, GITHOOKS_DIRNAME);
	const hooksUnderscoredDir = join(gitRootDir, GITHOOKS_UNDERSCORED_DIRNAME);

	// create .githooks/ and set executable if not already
	try {
		await Deno.mkdir(hooksUnderscoredDir, { recursive: true });
	} catch (err) {
		if (!(err instanceof Deno.errors.AlreadyExists)) {
			throw err;
		}
	}

	// write .githooks/pre-commit if not already
	const precommitPath = join(hooksDir, 'pre-commit');
	try {
		await Deno.lstat(precommitPath);
	} catch (err) {
		if (!(err instanceof Deno.errors.NotFound)) {
			throw err;
		}
		const file = await Deno.create(precommitPath);
		await Deno.chmod(precommitPath, 0o755);
		file.write(new TextEncoder().encode('deno lint'));
		file.close();
	}

	// write .githooks/_/.gitignore
	const gitignorePath = join(hooksUnderscoredDir, '.gitignore');
	await Deno.writeTextFile(gitignorePath, '*', {
		create: true,
		append: false,
	});

	// write .githooks/_/* proxy hooks
	await Promise.all(GIT_HOOKS.map((hook) => {
		const hookPath = join(hooksUnderscoredDir, hook);
		const script = `\
#!/usr/bin/env sh
GITHOOKS_CURRENT_HOOK=${hook} source "$(dirname "$0")/${GITHOOKS_SCRIPT_NAME}" $@
`;
		return Deno.writeTextFile(hookPath, script, {
			create: true,
			append: false,
			mode: 0o755,
		});
	}));

	// write hook.ts
	const scriptPath = join(hooksUnderscoredDir, GITHOOKS_SCRIPT_NAME);
	await Deno.writeTextFile(scriptPath, GITHOOKS_SCRIPT);
	await Deno.chmod(scriptPath, 0o755);

	await configureHooksPath(cwd, hooksUnderscoredDir);
}
