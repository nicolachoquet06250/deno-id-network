import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import { Context } from "../../lib/http/Context.ts";
import { exists } from "https://deno.land/std@0.61.0/fs/mod.ts";

@Controller('/public')
export class TypeScript {

	@InjectedProperty({ type: Context })
	private context?: Context;

	private get deno() {
		// @ts-ignore
		return Deno;
	}

	@Get('/scripts/:file.js', 'ts_file')
	public async get_bundle() {
		if (this.context && this.context.has_param('file')) {
			const path = `${this.deno.cwd()}/project/public/ts/${this.context.param('file')}.ts`;
			if (await exists(path)) {
				const [diagnostics, emit] = await this.deno.bundle(`./project/public/ts/${this.context.param('file')}.ts`);

				// @ts-ignore
				if (diagnostics.length > 0) {
					// @ts-ignore
					for (const diag of diagnostics) {
						let warn = `WARN ( ${diag.code} ) | ${diag.messageText} | ${diag.fileName}`;
						if (diag.start) warn += ` | l ${diag.start.line}:${diag.start.character}`;
						if (diag.end) warn += ` / l ${diag.end.line}:${diag.end.character}`;

						let log_content = '';
						if (!await exists(`${this.deno.cwd()}/logs`)){
							await this.deno.mkdir(`${this.deno.cwd()}/logs`);
						}

						const log_path = `${this.deno.cwd()}/logs/${this.context.param('file')}.log`;
						if (await exists(log_path)) {
							log_content = await this.deno.readTextFile(log_path);
						}
						await this.deno.writeTextFile(log_path, `${log_content}\n${warn}`);
					}
				}
				this.context.header('Content-Type', 'text/javascript').respond(emit);
			}
		}
	}

	@Get('/styles/:file.css', 'css_file')
	public async get_css() {
		if (this.context && this.context.has_param('file')) {
			this.context.header('Content-Type', 'text/css');
			const path = `${this.deno.cwd()}/project/public/css/${this.context.param('file')}.css`;
			if (await exists(path)) this.context.respond(await this.deno.readTextFile(path));
			else this.context.set_status(404).respond('');
		}
	}
}
