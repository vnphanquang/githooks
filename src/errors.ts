/**
 * @module
 *
 * Errors caught by `@vnphanquang/githooks`
 */

/**
 * Base error
 */
export class GitHooksError extends Error {
	stderr: Uint8Array;
	constructor(message: string, stderr: Uint8Array) {
		super(message);
		this.stderr = stderr;
	}
}

/**
 * Error when the current directory is **NOT WITHIN** a git directory
 */
export class NotGitDirectoryError extends GitHooksError {
	constructor(stderr: Uint8Array) {
		super('Not a git directory', stderr);
	}
}

/**
 * Error during configuring `git.config.core.hooksPath`.
 * This is not likely to happen.
 */
export class GitHooksPathConfigError extends GitHooksError {
	constructor(stderr: Uint8Array) {
		super('Error while configuring git.config.core.hooksPath', stderr);
	}
}
