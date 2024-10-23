import {
	denoAddGithooks,
	denoAddHusky,
	denoAddLefthook,
	githooksInit,
	huskyInit,
	initDenoAndGit,
	lefthookInit,
} from './utils.ts';
import { sandbox } from '../tests/utils.ts';

const GROUP = 'init';

function wrap(fn: (cwd: string) => Promise<void>) {
	return sandbox(async (cwd) => {
		await initDenoAndGit(cwd);
		await fn(cwd);
	});
}

// npm:husky init
Deno.bench('npm:husky', { group: GROUP }, async (b) => {
	await wrap(async (cwd) => {
		await denoAddHusky(cwd);
		b.start();
		await huskyInit();
		b.end();
	});
});

// npm:lefthook install
Deno.bench('npm:lefthook', { group: GROUP }, async (b) => {
	await wrap(async (cwd) => {
		await denoAddLefthook(cwd);
		b.start();
		await lefthookInit();
		b.end();
	});
});

// jsr:@vnphanquang/githooks init
Deno.bench('jsr:@vnphanquang/githooks', { group: GROUP, baseline: true }, async (b) => {
	await wrap(async (cwd) => {
		await denoAddGithooks(cwd);
		b.start();
		await githooksInit();
		b.end();
	});
});
