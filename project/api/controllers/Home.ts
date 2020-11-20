import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import {Context, CustomRouter} from "../../lib/http/mod.ts";

@Controller()
export class Home {

	@InjectedProperty({ type: Context })
	private context?: Context;

	@InjectedProperty({ type: CustomRouter })
	private router?: CustomRouter;

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

			const url = 'http' + (Boolean(parseInt(SECURE)) ? 's' : '')  + '://' + (DOMAIN ? DOMAIN : this.context.request().url.hostname)
				// @ts-ignore
				+ this.router.url('ts_file', { file: 'app' });

			this.context.init_headers({ 'Content-Type': 'text/html' }).respond(`
				<!DOCTYPE html>
				<html lang="fr">
					<head>
						<meta charset="utf8" />
						<title>Test de Websockets</title>
					</head>
					<body>
						
						<script src="${url}"></script>
					</body>
				</html>
			`);
		}
	}
}
