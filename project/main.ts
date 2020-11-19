import "https://deno.land/x/dotenv/load.ts";

import { Application } from "https://deno.land/x/oak/mod.ts";
import { CustomRouter, Route, WebsocketRouter } from "./lib/http/Router.ts";
import { WebSocket } from "https://deno.land/std@0.61.0/ws/mod.ts";
import { getAllRoutes } from "./api/mod.ts";
import { DependencyInjection } from "./lib/dis/DependencyInjection.ts";
import { WSContext } from "./lib/http/mod.ts";
import { acceptable, acceptWebSocket, isWebSocketCloseEvent } from "./lib/middlewares/websocket/mod.ts";

const users = new Map<number, WebSocket>();
const socks: WebSocket[] = [];

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
		/*app.use(async function (ctx: any, next: Function) {
			if (WebsocketRouter._routes.map(
				(r: Route) => WebsocketRouter._groupUrls.get(r.target.constructor.name) + r.route
			).indexOf(ctx.request.url.pathname)) {
				const route = WebsocketRouter._routes.reduce((reducer: Route, current: Route): Route => {
					if (current.route === ctx.request.url.pathname) reducer = current;
					return reducer;
				})

				return await (async (context: any, next: Function, route: Route) => {
					if (acceptable(context.request.serverRequest)) {
						const { conn, r: bufReader, w: bufWriter, headers } = context.request.serverRequest;

						const socket: WebSocket = await acceptWebSocket({ conn, bufReader, bufWriter, headers });

						const { target, callback } = route;

						let userId = socks.push(socket) - 1;

						// Register user connection
						users.set(userId, socket);

						const _context = DependencyInjection.instantiateType(WSContext, context, next, socket, users, userId);

						try {
							const ctx = DependencyInjection.instantiateType(target.constructor);
							// on_connect
							await ctx[callback](_context);

							// Wait for new messages
							for await (const event of socket) {
								const message = typeof event === "string" ? event : "";

								console.log('on_message function')
								if ('on_message' in ctx) {
									await ctx.on_message(message, _context);
								}

								// Unregister user connection
								if (!message && isWebSocketCloseEvent(event)) {
									console.log('on_disconnect callback');
									if ('on_disconnect' in ctx) {
										await ctx.on_disconnect(_context);
									}

									users.delete(userId);
									socks.splice(userId, 1);
									break;
								}
							}

						} catch (e) {
							_context.set_status(500).respond({
								status: 'error',
								code: 500,
								message: e.message
							})
						}
					} else {
						throw new Error('Error when connecting websocket');
					}
					return await next();
				})(ctx, next, route);
			}
			return await next();
		});*/

		router.get('/messages', async (ctx: any) => {
			await ctx.upgrade();
			if (acceptable(ctx.request.serverRequest)) {
				const { conn, r: bufReader, w: bufWriter, headers } = ctx.request.serverRequest;
				acceptWebSocket({ conn, bufWriter, bufReader, headers }).then(async (socket: WebSocket) => {
					socket.send('You are connected');

					for await (let data of socket) {
						if (isWebSocketCloseEvent(data)) {
							console.log('You are disconnected, Goodbye');
							break;
						}
						console.log(data);
						socket.send('Your message " ' + data + ' " was successfully received');
					}
				}).catch(async (err) => {
					console.error(`failed to accept websocket: ${err}`);
				});
			} else {
				throw new Error('Error when connecting websocket');
			}
		});

		app.use(router.routes());
		app.use(router.allowedMethods());

		console.log(`server is starting on ${DOMAIN ? DOMAIN : 'http://' + objectToListen.hostname}${objectToListen.port === 80 ? '' : ':' + objectToListen.port}`)
		await app.listen(objectToListen);
	}
}

await Main.run();
