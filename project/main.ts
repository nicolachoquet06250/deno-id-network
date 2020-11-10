import { CustomRouter as Router } from "./lib/http/Router.ts";
import { Application } from "https://deno.land/x/oak/mod.ts";
import { getAllRoutes } from "./api/mod.ts";

class Main {
	static async run() {
		getAllRoutes();

		const app = new Application();
		const router = new Router();

		app.use(router.routes());
		app.use(router.allowedMethods());

		console.log('server is starting')
		await app.listen({ port: 8000 });
	}
}

await Main.run();
