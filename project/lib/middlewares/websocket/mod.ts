import { Route, WebsocketRouter } from "../../http/mod.ts";
import { DependencyInjection } from "../../dis/DependencyInjection.ts";
import { WSContext } from "../../http/mod.ts";
import { acceptWebSocket, isWebSocketCloseEvent, acceptable } from "https://deno.land/std/ws/mod.ts";

import type { WebSocket } from "https://deno.land/std/ws/mod.ts";
export { generate } from "https://deno.land/std@0.61.0/uuid/v4.ts";

export const users = new Set();


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

	for await (const ev of socket) {
		if (socket.isClosed) {
			if ('on_disconnect' in ctx) {
				await ctx.on_disconnect(_context);
			}
			users.delete(socket);
			break;
		} else {
			try {
				const json = JSON.parse(ev);
				if ('channel' in json && `on_channel_${json.channel}` in ctx) {
					const channel = json.channel;
					delete json.channel;
					ctx[`on_channel_${channel}`](json, _context);
				} else {
					if ('on_json' in ctx) {
						await ctx.on_json(json, _context);
						break;
					}
				}
			} catch(e) {
				if (typeof ev === "string" && 'on_text' in ctx) {
					await ctx.on_text(ev, _context);
					break;
				}
			}
			if ('on_message' in ctx) {
				await ctx.on_message(ev, _context);
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
