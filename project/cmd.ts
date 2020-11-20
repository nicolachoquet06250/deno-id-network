import { Command } from 'https://cdn.depjs.com/cmd/mod.ts';
import { red, yellow, green, bold } from "https://deno.land/std@0.74.0/fmt/colors.ts";
import { exists } from "https://deno.land/std@0.61.0/fs/mod.ts";
import { models } from "./api/models/mod.ts";

const program = new Command('network-id');

program.version('1.0.0')

program
	.option('-c, --config <FILE>', 'load configuration file')
	.option('-v, --verbose', 'enable verbose mode')

program.command('make:env <json>')
	.description('generate .env file with json keys and values')
	.action(async (param: string) => {
		try {
			const json: Record<string, string> = JSON.parse(param);

			let file_content = '';

			for (let key of Object.keys(json)) {
				file_content += `${key}=${json[key]}\n`;
			}

			if (!(await exists('.env'))) {
				// @ts-ignore
				Deno.writeTextFileSync('.env', file_content);

				console.log(green('Le fichier .env à été créé avec succès'))
			} else {
				console.warn(yellow('WARNING : le fichier .env existe déjà'))
			}
		} catch (e) {
			console.error(red(bold('ERROR :') + ' le json fournis n\'est pas au bon format !'))
		}
	});

program.command('db:migrate')
	.description('migrate database')
	.action(async () => {
		try {
			// @ts-ignore
			await Promise.all(models.map(m => m.migrate()))
			console.log(green('migration successful !'))
		} catch (e) {
			console.error(red(bold('ERROR :') + ' ' + e.message))
		}
	});

program.command('make:migration').action(async () => {
	for (let model of models) {
		// @ts-ignore
		await model.create_migration();
	}
})

// @ts-ignore
program.parse(Deno.args)
