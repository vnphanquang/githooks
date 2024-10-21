import { sandbox } from 'jsr:@lambdalisue/sandbox';

async function benchWrapper(fn: () => void | Promise<void>) {
	const sbox = await sandbox();
	try {
		// init a deno project
		await new Deno.Command('deno', {
			args: ['init'],
		}).output();

		// init a git repository
		await new Deno.Command('git', {
			args: ['init'],
		}).output();

		await fn();
	} finally {
		await sbox[Symbol.asyncDispose]();
	}
}

// npm:husky init
await benchWrapper(async () => {
	// add
	await new Deno.Command('deno', {
		args: ['add', 'npm:husky'],
	}).output();

	// benchmark husky init
	Deno.bench('npm:husky', { group: 'init', baseline: true }, async () => {
		await new Deno.Command('deno', {
			args: ['-A', 'run', 'npm:husky', '--cached-only'],
		}).output();
	});
});

// jsr:@vnphanquang/githooks init
await benchWrapper(async () => {
	// add
	await new Deno.Command('deno', {
		args: ['add', 'jsr:@vnphanquang/githooks'],
	}).output();

	// benchmark husky init
	Deno.bench('jsr:@vnphanquang/githooks', { group: 'init' }, async () => {
		await new Deno.Command('deno', {
			args: ['-A', 'run', 'jsr:@vnphanquang/githooks', '--cached-only'],
		}).output();
	});
});
