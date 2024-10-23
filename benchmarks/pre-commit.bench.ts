import {
	commit,
	denoAddGithooks,
	denoAddHusky,
	denoAddLefthook,
	githooksInit,
	huskyInit,
	initDenoAndGit,
	lefthookInit,
} from './utils.ts';
import { sandbox, writeAndStageCode } from '../tests/utils.ts';

const GROUP = 'pre-commit';

function wrap(fn: (cwd: string) => Promise<void>) {
	return sandbox(async (cwd) => {
		// git init, deno init
		await initDenoAndGit(cwd);
		// write some code and run `git add`
		await writeAndStageCode(cwd);
		// actual benchmark
		await fn(cwd);
	});
}

// npm:husky
Deno.bench('npm:husky', { group: GROUP }, async (b) => {
	await wrap(async (cwd) => {
		await denoAddHusky(cwd, true);
		await huskyInit();
		b.start();
		await commit(cwd);
		b.end();
	});
});

// npm:lefthook
Deno.bench('npm:lefthook', { group: GROUP }, async (b) => {
	await wrap(async (cwd) => {
		await denoAddLefthook(cwd);
		await lefthookInit();
		b.start();
		await commit(cwd);
		b.end();
	});
});

// jsr:@vnphanquang/githooks
Deno.bench('jsr:@vnphanquang/githooks', { group: GROUP, baseline: true }, async (b) => {
	await wrap(async (cwd) => {
		await denoAddGithooks(cwd, true);
		await githooksInit();
		b.start();
		await commit(cwd);
		b.end();
	});
});
