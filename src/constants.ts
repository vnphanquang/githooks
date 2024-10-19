/**
 * All git hook names. See [Git Hooks](https://git-scm.com/docs/githooks#_hooks)
 */
export const GIT_HOOKS = [
	'applypatch-msg',
	'pre-applypatch',
	'post-applypatch',
	'pre-commit',
	'pre-merge-commit',
	'prepare-commit-msg',
	'commit-msg',
	'post-commit',
	'pre-rebase',
	'post-checkout',
	'post-merge',
	'pre-push',
	'pre-receive',
	'update',
	'proc-receive',
	'post-receive',
	'post-update',
	'reference-transaction',
	'push-to-checkout',
	'pre-auto-gc',
	'post-rewrite',
	'sendemail-validate',
	'fsmonitor-watchman',
	'p4-changelist',
	'p4-prepare-changelist',
	'p4-post-changelist',
	'p4-pre-submit',
	'post-index-change',
];

/** where user-defined hooks live */
export const GITHOOKS_DIRNAME = '.githooks';

/** where `git.config.core.hooksPath` points to */
export const GITHOOKS_UNDERSCORED_DIRNAME = '.githooks/_';

/** name of centralized script that all hooks will go through */
export const GITHOOKS_SCRIPT_NAME = 'hook.sh';

/**
 * Middleware script that all hooks will go through before reaching
 * the target user-defined hook (if any)
 *
 * This is greatly inspired by [husky](https://github.com/typicode/husky).
 * The script content is similar to that of `husky`, but not identical
 */
export const GITHOOKS_SCRIPT = `\
#!/usr/bin/env sh
[ "$GITHOOKS" = "2" ] && set -x

# skip if GITHOOKS_CURRENT_HOOK not set
hook_script=$(dirname "$(dirname "$0")")/\${GITHOOKS_CURRENT_HOOK:-$(basename "$0")}

# skip if hook has not been setup
[ ! -f "$hook_script" ] && exit 0

[ -z "$GITHOOKS_CURRENT_HOOK" ] && echo -e "\e[33mWarning: unset GITHOOKS_CURRENT_HOOK. Hook may not function properly. Check "$0"\e[0m"

# source the global init script if any
init_script="\${XDG_CONFIG_HOME:-$HOME/.config}/githooks/init"
[ -f "$init_script" ] && source "$init_script"

# skip if GITHOOKS_SKIP=0
[ "$GITHOOKS" = "0" ] && echo "Found GITHOOKS=0. Skipping..." && exit 0

# execute hook
sh -e "$hook_script" "$@"
exit_status=$?

exit $exit_status
`;
