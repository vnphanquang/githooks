import {
	denoAddGithooks,
	denoAddHusky,
	githooksInit,
	huskyInit,
	initDenoAndGit,
	sandbox,
} from './utils.ts';

const GROUP = 'init';

function wrap(fn: () => Promise<void>) {
	return sandbox(async () => {
		const cwd = Deno.cwd();
		await initDenoAndGit(cwd);
		await fn();
	});
}

// npm:husky init
Deno.bench('npm:husky', { group: GROUP, baseline: true }, async (b) => {
	await wrap(async () => {
		await denoAddHusky();
		b.start();
		await huskyInit();
		b.end();
	});
});

// jsr:@vnphanquang/githooks init
Deno.bench('jsr:@vnphanquang/githooks', { group: GROUP, baseline: true }, async (b) => {
	await wrap(async () => {
		await denoAddGithooks();
		b.start();
		await githooksInit();
		b.end();
	});
});
