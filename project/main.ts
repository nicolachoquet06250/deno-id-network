import "https://deno.land/x/dotenv/load.ts";

import { Application } from "https://deno.land/x/oak/mod.ts";
import { CustomRouter } from "./lib/http/Router.ts";
import { getAllRoutes } from "./api/mod.ts";
import { users, websocket } from "./lib/middlewares/websocket/mod.ts";

type ENV = {
	IP: string, PORT: string,
	DOMAIN: string, SECURE: string
}

class Main {
	private static get env(): ENV {
		// @ts-ignore
		const { IP, PORT, DOMAIN, SECURE } = Deno.env.toObject();
		return { IP, PORT, DOMAIN, SECURE };
	}

	static async run_web() {
		const { IP, PORT, DOMAIN, SECURE } = this.env;
		
		let objectToListen = { port: 8000, hostname: '127.0.0.1' };
		if (PORT) objectToListen.port = parseInt(PORT);
		if (IP) objectToListen.hostname = IP;

		getAllRoutes();

		const app = new Application({state: {users}});
		const router = new CustomRouter();

		// for websockets
		app.use(websocket);

		app.use(router.routes());
		app.use(router.allowedMethods());

		await app.listen(objectToListen);

		console.log(`open on ${Boolean(parseInt(SECURE)) ? 'https' : 'http'}://${DOMAIN ? DOMAIN : IP}${PORT === '80' ? '' : `:${PORT}`}`)

		app.addEventListener('listen', (server: any) => {
			console.log(`open ${server.secure ? 'https' : 'http'}://${server.hostname}:${server.port}`);
		});
	}
}

await Main.run_web();


