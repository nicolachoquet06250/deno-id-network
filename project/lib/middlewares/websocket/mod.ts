import { Route, WebsocketRouter } from "../../http/mod.ts";
import { DependencyInjection } from "../../dis/DependencyInjection.ts";
import { WSContext } from "../../http/mod.ts";
import { acceptWebSocket, isWebSocketCloseEvent, acceptable } from "https://deno.land/std/ws/mod.ts";

import type { WebSocket } from "https://deno.land/std/ws/mod.ts";
import get = Reflect.get;
export { generate } from "https://deno.land/std@0.61.0/uuid/v4.ts";

export const users = new Set();

const getCallback = (map: Map<string, string>, required: string): string|boolean => {
	// @ts-ignore
	return Array.from(map).reduce((reducer: string | boolean, current: string[]) => {
		const [name, callback] = current;
		if (name === required) {
			reducer = callback;
		}
		return reducer;
	}, false);
}

export const middleware = async (context: any, next: Function, route: Route) => {
	context.response.status = 204;

	if (!acceptable(context.request.serverRequest)) {
		context.response.status = 400;
		throw new Error(`not upgradable to WebSocket`);
	}

	const socket = await context.upgrade();

	const userId = socket.conn.rid;

	users.add(socket);

	const { target, callback } = route;

	const _context = DependencyInjection.instantiateType(WSContext, context, next, socket, users, userId);

	const ctx = DependencyInjection.instantiateType(target.constructor);
	// on_connect
	await ctx[callback](_context);

	const channels = WebsocketRouter._channelsPerRoute.get(target.constructor.name);
	const events = WebsocketRouter._eventsPerRoute.get(target.constructor.name);

	for await (const ev of socket) {
		if (socket.isClosed) {
			if (events) {
				const callback: string|boolean = getCallback(events, 'disconnect');
				if (callback) {
					await ctx[callback](ev, _context);
					break;
				}
			}

			users.delete(socket);
			break;
		} else {
			try {
				let channel_found = false;
				const json = JSON.parse(ev);
				const channel = json.channel;

				if (channels) {
					for (let channel_info of Array.from(channels)) {
						const [channel_name, channel_callback] = channel_info;

						if (channel_name === channel) {
							delete json.channel;
							await ctx[channel_callback](json, _context);
							channel_found = true;
							break;
						}

					}
				}

				if (!channel_found) {
					const events = WebsocketRouter._eventsPerRoute.get(target.constructor.name);
					if (events) {
						const callback: string|boolean = getCallback(events, 'json');
						if (callback) {
							await ctx[callback](json, _context);
							break;
						}
					}
				}
			} catch(e) {
				if (typeof ev === "string") {
					if (events) {
						const callback: string|boolean = getCallback(events, 'text');
						if (callback) {
							await ctx[callback](ev, _context);
							break;
						}
					}
				}
			}
			if (events) {
				const callback: string|boolean = getCallback(events, 'message');
				if (callback) {
					await ctx[callback](ev, _context);
					break;
				}
			}
		}
	}
};

export const websocket = async (ctx: any, next: Function) => {
	if (WebsocketRouter._routes.map(
		(r: Route) => WebsocketRouter._groupUrls.get(r.target.constructor.name) + r.route
	).indexOf(ctx.request.url.pathname) !== -1) {
		const route = WebsocketRouter._routes.map(
			(r: Route) => ({
				...r, route: WebsocketRouter._groupUrls.get(r.target.constructor.name) + r.route
			})
		).reduce((reducer: Route, current: Route): Route => {
			if (current.route === ctx.request.url.pathname) reducer = current;
			return reducer;
		});

		try {
			await middleware(ctx, next, route);
		} catch (e) {
			console.error(e);
		}
	}
	return await next();
};

export type { WebSocket };
export { acceptable, acceptWebSocket, isWebSocketCloseEvent };
