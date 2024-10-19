Utility for setting up git hooks. A Deno port of [husky]

[![MIT][license.badge]][license] [![codecov][codecov.badge]][codecov] [![JSR][jsr.badge.package]][jsr.package] [![JSR][jsr.badge.score]][jsr.package]

## Usage as CLI

1. Make sure your project is within a git directory

   ```bash
   git init
   ```

2. Run setup script

   ```bash
   deno run -A jsr:@vnphanquang/githooks/bin init
   ```

   Alternatively, run with verbose permissions **at project root**:

   ```bash
   deno run --allow-read="." --allow-write="./.githooks" --allow-run="git" jsr:@vnphanquang/githooks/bin init
   ```

3. Edit `./githooks/pre-commit` to your needs. Alternatively, you can create any git hook script by adding
   it to `.githooks/<your_hook>`. For example

   ```bash
   # .githooks/pre-push
    deno fmt
   ```

4. Optionally, add script as [deno task](https://docs.deno.com/runtime/reference/cli/task_runner/)
	 to `deno.json`

   ```json
   {
       "tasks": {
         "githooks": "deno run --allow-read=\".\" --allow-write=\"./.githooks\" --allow-run=\"git\" jsr:@vnphanquang/githooks/bin init"
       }
   }
   ```

> [!NOTE]
> This library was written and tested in [Deno 2](https://deno.com/blog/v2.0).

## Usage as Library

You may use this library as a Deno module. See [jsr:@vnphanquang/githooks][jsr.package.docs].

```typescript
import { init } from 'jsr:@vnphanquang/githooks';

await init(Deno.cwd());
```

## Prior Arts

This project is greatly inspired by [husky]; credits go to [@typicode](https://github.com/typicode). Please show support over there.

[Yakiyo/deno_hooks](https://github.com/Yakiyo/deno_hooks) is a similar project. Please show them some love too.

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
