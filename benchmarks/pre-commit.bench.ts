import * as path from 'jsr:@std/path/posix';

import { commit, githooksInit, huskyInit, initDenoAndGit } from './utils.ts';
import { sandbox, writeAndStageCode } from '../tests/utils.ts';
import { GITHOOKS_DIRNAME } from '../src/constants.ts';

const GROUP = 'pre-commit (runtime)';

function wrap(hookDirname: string, fn: (cwd: string) => Promise<void>) {
	return sandbox(async (cwd) => {
		await Promise.all([initDenoAndGit(cwd), writeAndStageCode(cwd)]);

		// write pre-commit hook
		const huskyDir = path.join(cwd, hookDirname);
		const preCommitHookPath = path.join(huskyDir, 'pre-commit');
		await Deno.mkdir(huskyDir, { recursive: true });
		await Deno.writeTextFile(preCommitHookPath, 'deno lint');

		await fn(cwd);
	});
}

// npm:husky
Deno.bench('npm:husky', { group: GROUP, baseline: true }, async (b) => {
	await wrap('.husky', async (cwd) => {
		await huskyInit();

		b.start();
		await commit(cwd);
		b.end();
	});
});

// jsr:@vnphanquang/githooks
Deno.bench('jsr:@vnphanquang/githooks', { group: GROUP }, async (b) => {
	await wrap(GITHOOKS_DIRNAME, async (cwd) => {
		await githooksInit();

		b.start();
		await commit(cwd);
		b.end();
	});
});
