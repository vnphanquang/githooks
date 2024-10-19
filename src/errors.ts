export class GitHooksError extends Error {
	stderr: Uint8Array;
	constructor(message: string, stderr: Uint8Array) {
		super(message);
		this.stderr = stderr;
	}
}

export class NotGitDirectoryError extends GitHooksError {
	constructor(stderr: Uint8Array) {
		super('Not a git directory', stderr);
	}
}

export class GitHooksPathConfigError extends GitHooksError {
	constructor(stderr: Uint8Array) {
		super('Error while configuring git.config.core.hooksPath', stderr);
	}
}
