import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import { Context } from "../../lib/http/Context.ts";
import { exists } from "https://deno.land/std@0.61.0/fs/mod.ts";
import { red, yellow, green, bold } from "https://deno.land/std@0.74.0/fmt/colors.ts";

@Controller('/public/scripts')
export class TypeScript {

	@InjectedProperty({ type: Context })
	private context?: Context;

	private get deno() {
		// @ts-ignore
		return Deno;
	}

	@Get('/:file.js')
	public async get_bundle() {
		if (this.context && this.context.has_param('file')) {
			const path = `${this.deno.cwd()}/project/public/ts/${this.context.param('file')}.ts`;
			if (await exists(path)) {
				const [diagnostics, emit] = await this.deno.bundle(`./project/public/ts/${this.context.param('file')}.ts`);

				// @ts-ignore
				if (diagnostics.length > 0) {
					// const diags = JSON.parse(diagnostics);
					// @ts-ignore
					for (const diag of diagnostics) {
						let warn = `WARN ( ${diag.code} ) | ${diag.messageText} | ${diag.fileName}`;
						if (diag.start) {
							warn += ` | l ${diag.start.line}:${diag.start.character}`;
						}
						if (diag.end) {
							warn += ` / l ${diag.end.line}:${diag.end.character}`;
						}
						console.warn(yellow(warn))
					}
				}

				this.context.header('Content-Type', 'text/javascript').respond(emit);
			}
		}
	}
}
