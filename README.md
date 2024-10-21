Utility for setting up git hooks. A Deno port of [husky]

[![MIT][license.badge]][license] [![codecov][codecov.badge]][codecov] [![JSR][jsr.badge.package]][jsr.package] [![JSR][jsr.badge.score]][jsr.package]

> [!NOTE]
> This library was written in [Deno 2](https://deno.com/blog/v2.0),
> tested on Windows, MacOS, and Linux. See [code coverage](https://app.codecov.io/github/vnphanquang/githooks/flags?flags%5B0%5D=macos-latest&flags%5B1%5D=ubuntu-latest&flags%5B2%5D=windows-latest) for more information.

## Usage as CLI

1. Make sure your project is within a git directory...

   ```bash
   git init .
   ```

2. Run initialization script...

   ```bash
   deno run -A jsr:@vnphanquang/githooks/bin init
   ```

   `init` will search up and run at the nearest git root directory, if any, or fail otherwise. Alternatively, run with verbose permissions **at project root**:

   ```bash
   deno run --allow-read="." --allow-write=".githooks" --allow-run="git" jsr:@vnphanquang/githooks/bin init
   ```

3. Edit `./githooks/pre-commit` to your needs. You can create, edit, or remove any git hook script `.githooks/<your_hook>`. For example:

   ```bash
   #!/usr/bin/env sh
   deno fmt

   # file: .githooks/pre-push
   ```

4. Optionally, add script as [Deno task](https://docs.deno.com/runtime/reference/cli/task_runner/).
   See [Running as Deno Task](#automatic-initialization-for-fresh-repository) for more information.

## Usage as Library

You may use this library as a Deno module. See [jsr:@vnphanquang/githooks][jsr.package.docs].

```typescript
import { init } from 'jsr:@vnphanquang/githooks';

await init(Deno.cwd());
```

## Changelog

See [CHANGELOG](https://github.com/vnphanquang/githooks/blob/main/CHANGELOG.md) for more information.

## Recipes

### Running as Deno Task

It is helpful to save the script as a [Deno task](https://docs.deno.com/runtime/reference/cli/task_runner/):

```json
{
	"tasks": {
		"githooks": "deno run --allow-read=\".\" --allow-write=\".githooks\" --allow-run=\"git\" jsr:@vnphanquang/githooks/bin init"
	}
}
```

Subsequent runs can be simplified as:

```bash
deno task githooks
```

### Adding Hook

Simply add your [git hook](https://git-scm.com/docs/githooks#_hooks) script to `.githooks/<hook_name>`.
For example, you can quickly add/update `pre-commit` by running:

```bash
echo "deno test" > .githooks/pre-commit
```

### (No) Automatic Initialization

Unlike Node, Deno does not support pre- or post- script pattern.
Prefer to [use Deno task](#running-as-deno-task) and include
explicit instruction for your team to run it after each `git clone` or upgrade.

### Usage with [lint-staged]

Invoke [lint-staged] in your hook script. For example:

```bash
#!/usr/bin/env sh
deno run -A npm:lint-staged

# file: .githooks/pre-commit
```

As expected, this should look for any lint-staged config files at the project root. See [lint-staged configuration documentation](https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration) for more information.

### Skipping Certain Hooks

If your git command supports `--no-verify`. You may skip running hooks by adding this flag.

```bash
git commit --no-verify -m "skip hooks"
```

Alternatively, you may also set the `GITHOOKS` env to `0` to skip the running hooks.

```bash
# assuming pre-commit hook has been set up at ./.githooks/pre-commit
GITHOOKS=0 git commit -m "skip hooks"
```

### Pre-Hook Setup Script

You may execute some commands before a triggered hook actually runs by having one of the following
scripts:

- on UNIX:
  - `$XDG_CONFIG_HOME/githooks/init`
  - `~/.config/githooks/init`
- on Windows:
  - `C:\Users\<user_name>\.config\githooks\init.sh`

For example:

```bash
#!/usr/bin/env sh

# run some global setup
echo "This runs before running $GITHOOKS_TRIGGER"

# skip hook that meets certain condition
if [ "$GITHOOKS_TRIGGER" = "pre-push" ]; then
	export GITHOOKS=0
fi

# file: ~/.config/githooks/init
```

> [!NOTE]
> Within the setup script, you have access to the `GITHOOKS_TRIGGER` env - the name
> of the hook that is about to run.

### Shell Debug Mode

You may set the `GITHOOKS` env to `2` to enable more verbose output from hook
scripts. Underneath, this run `set -x`.

```bash
# assuming pre-commit hook has been set up at ./.githooks/pre-commit
GITHOOKS=2 git commit -m "verbose run"
```

## Prior Arts & Acknowledgements

### Comparison and Benchmark vs [husky]

This project is greatly inspired by [husky]; it is even fair to consider this as a direct Deno port of `huksy` . Credits should go to [@typicode](https://github.com/typicode). Please show support over there. In fact, today, you can use `husky` directly in Deno:

```bash
deno run -A npm:husky
```

This project builds upon ideas from `husky` while trying to stay minimal and only extend on some functionality that satisfies my personal needs. It is also an attempt to utilize Deno for more explicit permissions and idiomatic testing (`husky` uses `bash` for tests, which is totally fine but simply not my preference).

Regarding performance, both `npm:husky` and `jsr:@vnphanquang/githooks` are comparable:

- `npm:husky init` tends to run **~1.03x faster on linux** compared to `jsr:@vnphanquang/githooks`
- `npm:husky init` tends to run **~1.10x slower on macos** compared to `jsr:@vnphanquang/githooks`
- `npm:husky init` tends to run **as just fast on windows** compared to `jsr:@vnphanquang/githooks`

The numbers above are simplified. See [benchmark runs](https://github.com/vnphanquang/githooks/actions/workflows/benchmark.yaml) for more details. You can try the benchmark on your own machine by cloning the project and running:

```bash
deno task bench
```

Benchmarks live at [benchmarks/*](https://github.com/vnphanquang/githooks/tree/main/benchmarks).

### Similar Projects

Other projects with similar objective exists. Please show them some love too.

- [Yakiyo/deno_hooks](https://github.com/Yakiyo/deno_hooks): also inspired by [husky], written in Deno 1; no tests have been implemented as of this writing.
- [xCykrix/githooked](https://github.com/xCykrix/githooked): also inspired by [husky], [originally written in Deno](https://www.reddit.com/r/Deno/comments/thfub7/githooked_the_deno_githook_handler_for_your/) but has likely been migrated away from Deno towards a standalone shell script, which is probably the most lightweight & cross-platform solution.

## Contributing

See [CONTRIBUTING](https://github.com/vnphanquang/githooks/blob/main/CONTRIBUTING.md) for more information.

[husky]: https://github.com/typicode/husky
[deno]: https://deno.com/
[jsr.badge.package]: https://jsr.io/badges/@vnphanquang/githooks
[jsr.badge.score]: https://jsr.io/badges/@vnphanquang/githooks/score
[jsr.package]: https://jsr.io/@vnphanquang/githooks
[jsr.package.docs]: https://jsr.io/@vnphanquang/githooks/docs
[codecov]: https://codecov.io/github/vnphanquang/githooks
[codecov.badge]: https://codecov.io/github/vnphanquang/githooks/graph/badge.svg?token=dKkYUy4evr
[license.badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license]: https://github.com/vnphanquang/githooks/blob/main/LICENSE
[lint-staged]: https://github.com/lint-staged/lint-staged
