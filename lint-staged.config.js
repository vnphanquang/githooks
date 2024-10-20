export default {
	'*.ts': ['deno lint', 'deno fmt'],
	'*.{md,json,html}': 'deno fmt',
};
