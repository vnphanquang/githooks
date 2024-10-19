import { init } from './src/init.ts';
import { GitHooksError } from './src/errors.ts';
import deno from './deno.json' with { type: 'json' };

type Command = 'init';

const command = Deno.args[0] as Command | undefined;
if (!command) {
	console.log(`Usage: ${deno.name}  [install]`);
	console.log(`Version: ${deno.version}`);
	console.log('\nCommands:');
	console.log('  init		set up .githook directory');
	Deno.exit(0);
} else if (command !== 'init') {
	console.error(`"${command}" command is not supported.`);
	Deno.exit(128);
}

try {
	await init();
	Deno.exit(0);
} catch (err) {
	if (err instanceof GitHooksError) {
		Deno.stderr.write(err.stderr);
	} else {
		console.error(err);
	}
	Deno.exit(1);
}
