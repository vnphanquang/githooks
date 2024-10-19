import { GitHooksPathConfigError, NotGitDirectoryError } from './errors.ts';

/**
 * Run a git command
 */
export function git(cwd: string, ...args: string[]) {
	return new Deno.Command('git', {
		args,
		cwd,
	});
}

export async function getGitRootDir(cwd: string) {
	const { stdout, stderr, success } = await git(cwd, 'rev-parse', '--show-toplevel').output();
	if (!success) {
		throw new NotGitDirectoryError(stderr);
	}
	return new TextDecoder().decode(stdout).trim();
}

export async function configureHooksPath(cwd: string, hooksPath: string) {
	const { stderr, success } = await git(cwd, 'config', 'core.hooksPath', hooksPath).output();
	if (!success) {
		throw new GitHooksPathConfigError(stderr);
	}
}
