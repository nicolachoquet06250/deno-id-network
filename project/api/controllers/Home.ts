import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import { Context } from "../../lib/http/mod.ts";

@Controller()
export class Home {

	@InjectedProperty({ type: Context })
	private context?: Context;

	@Get()
	@Get('/home')
	@Get('/home/test')
	public async get() {
		if (this.context) {
			this.context.respond({
				page: 'home'
			});
		}
	}

	@Get('/ws/messages')
	public async ws() {
		if (this.context) {
			// @ts-ignore
			const { DOMAIN, SECURE } = Deno.env.toObject();
			const url = 'http' + (Boolean(parseInt(SECURE)) ? 's' : '')  + '://' + (DOMAIN ? DOMAIN : this.context.request().url.origin);

			this.context.init_headers({ 'Content-Type': 'text/html' }).respond(`
				<!DOCTYPE html>
				<html lang="fr">
					<head>
						<meta charset="utf8" />
						<title>Test de Websockets</title>
					</head>
					<body>
						
						<script src="${url}/public/scripts/app.js"></script>
					</body>
				</html>
			`);
		}
	}
}
