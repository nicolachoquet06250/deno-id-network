import "https://deno.land/x/dotenv/load.ts";

import {Application} from "https://deno.land/x/oak/mod.ts";
import {CustomRouter} from "./lib/http/Router.ts";
import {getAllRoutes} from "./api/mod.ts";
import {websocket} from "./lib/middlewares/websocket/mod.ts";

import {
	CloseEvent,
	ErrorEvent,
	EVENTS,
	MESSAGE_TYPE,
	MessageEvent,
	OpenEvent,
	WebSocketServer
} from "./lib/ws/WebSocketServer.ts";

enum MODES {
	WEB = 'web',
	WS = 'websocket'
}

class Main {
	private static _func_name: string = '';

	public static set func_name(name: string) {
		this._func_name = name;
	}

	public static async func() {
		// @ts-ignore
		await this[this._func_name]();
	}

	private static get env(): { IP: string, PORT: string, DOMAIN: string } {
		// @ts-ignore
		const { IP, PORT, DOMAIN } = Deno.env.toObject();
		return { IP, PORT, DOMAIN };
	}

	public static get args(): string[] {
		// @ts-ignore
		return Deno.args
	}

	static async run_web() {
		const { IP, PORT, DOMAIN } = this.env;
		
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

	static async run_websocket() {
		const { IP, PORT } = this.env;

		const ws = new WebSocketServer(IP, parseInt(PORT));

		/** websocket echo server */
		const port = parseInt(PORT);
		console.log(`websocket server is running on :${port}`);

		ws.addEventListener(EVENTS.ERROR, (e: ErrorEvent) => {
			console.error('WS ERROR =>', e.message);
		});


		ws.addEventListener(EVENTS.OPEN, (e: OpenEvent) => {
			e.socket.send('You are connected');
			console.log('new user connected');
		});

		ws.addEventListener(EVENTS.MESSAGE, (e: MessageEvent) => {
			if (e.type === MESSAGE_TYPE.JSON) {
				e.socket.send(JSON.stringify(e.message));
			} else {
				e.socket.send(e.message);
			}
			console.log(e.type, e.message);
		});

		ws.addEventListener(EVENTS.CLOSE, (e: CloseEvent) => {
			console.error('WS CLOSED =>', e.message);
		})

		await ws.serve();
	}
}

const arg = Main.args[0] || '';
const firstArg = arg.toUpperCase();
// @ts-ignore
const mode = MODES[firstArg];


if (mode !== undefined) {
	Main.func_name = `run_${mode}`;
	await Main.func();
} else await Main.run_web();
