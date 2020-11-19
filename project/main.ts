import "https://deno.land/x/dotenv/load.ts";

import { Application } from "https://deno.land/x/oak/mod.ts";
import { CustomRouter } from "./lib/http/Router.ts";
import { getAllRoutes } from "./api/mod.ts";
import { websocket } from "./lib/middlewares/websocket/mod.ts";


class Main {
	static async run() {
		// @ts-ignore
		const { IP, PORT, DOMAIN } = Deno.env.toObject();
		
		let objectToListen = { port: 8000, hostname: '127.0.0.1' };
		if (PORT) objectToListen.port = parseInt(PORT);
		if (IP) objectToListen.hostname = IP;

		getAllRoutes();

		const app = new Application();
		const router = new CustomRouter();

		// for websockets
		app.use(websocket);

		app.use(router.routes());
		app.use(router.allowedMethods());

		console.log(`server is starting on ${DOMAIN ? DOMAIN : 'http://' + objectToListen.hostname}${objectToListen.port === 80 ? '' : ':' + objectToListen.port}`)
		await app.listen(objectToListen);
	}
}

await Main.run();
