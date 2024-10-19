import { expect } from 'jsr:@std/expect';
import * as path from 'jsr:@std/path/posix';

import deno from '../deno.json' with { type: 'json' };

if (!import.meta.dirname) throw Error('import.meta.dirname is not defined');
const binPath = path.join(import.meta.dirname, '../src/bin.ts');

const textDecoder = new TextDecoder();

function githooks(...args: string[]) {
	return new Deno.Command(Deno.execPath(), {
		args: ['--allow-read', '--allow-write', '--allow-run', binPath, ...args],
	}).output();
}

Deno.test({
	name: 'run "githooks" without any args',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		const { success, stdout, code } = await githooks();
		expect(success).toBe(true);
		expect(code).toBe(0);

		const out = textDecoder.decode(stdout);
		expect(out).toContain(`Usage: ${deno.name}`);
		expect(out).toContain(`Version: ${deno.version}`);
	},
});

Deno.test({
	name: 'run "githooks" with unsupported command arg',
	permissions: {
		read: true,
		write: true,
		run: true,
	},
	async fn() {
		const { success, stderr, code } = await githooks('unsupported');
		expect(success).toBe(false);
		expect(code).toBe(128);
		expect(textDecoder.decode(stderr)).toContain('"unsupported" command is not supported.');
	},
});
