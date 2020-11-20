import { Route, WebsocketRouter } from "../../http/mod.ts";
import { DependencyInjection } from "../../dis/DependencyInjection.ts";
import { WSContext } from "../../http/mod.ts";
import { acceptWebSocket, isWebSocketCloseEvent, acceptable } from "https://deno.land/std/ws/mod.ts";

import type { WebSocket } from "https://deno.land/std/ws/mod.ts";
export { generate } from "https://deno.land/std@0.61.0/uuid/v4.ts";

// const users = new Map<number, WebSocket>();
// const socks: WebSocket[] = [];
export const users = new Set();


function broadcastEach(user: any) {
	// @ts-ignore
	user.send(this);
}

function broadcast(msg: any) {
	console.log('---broadcasting--->', typeof msg, msg);
	users.forEach(broadcastEach, msg);
}


export const middleware = async (context: any, next: Function, route: Route) => {
	/*await context.upgrade();

	if (acceptable(context.request.serverRequest)) {
		const { conn, r: bufReader, w: bufWriter, headers } = context.request.serverRequest;
		const { target, callback } = route;

		try {
			const socket: WebSocket = await acceptWebSocket({conn, bufReader, bufWriter, headers});

			let userId = socks.push(socket) - 1;
			// Register user connection
			console.log('user_id', userId, 'socket', socket);
			users.set(userId, socket);

			const _context = DependencyInjection.instantiateType(WSContext, context, next, socket, users, userId);

			try {
				const ctx = DependencyInjection.instantiateType(target.constructor);
				// on_connect
				await ctx[callback](_context);

				// Wait for new messages
				for await (const event of socket) {
					// Unregister user connection
					if (isWebSocketCloseEvent(event)) {
						console.log('on_disconnect callback');
						if ('on_disconnect' in ctx) {
							await ctx.on_disconnect(_context);
						}

						users.delete(userId);
						socks.splice(userId, 1);
						break;
					}

					const message = typeof event === "string" ? event : "";

					console.log('on_message function')
					if ('on_message' in ctx) {
						await ctx.on_message(message, _context);
					}
				}

			} catch (e) {
				_context.set_status(500).respond({
					status: 'error',
					code: 500,
					message: e.message
				})
			}
		} catch (e) {
			console.error(e);
			return await next();
		}
	} else {
		throw new Error('Error when connecting websocket');
	}*/

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

	// broadcast(`hello! ${socket.conn.rid}`);

	for await (const ev of socket) {
		if (socket.isClosed) {
			console.log('on_disconnect callback');
			if ('on_disconnect' in ctx) {
				await ctx.on_disconnect(_context);
			}
			users.delete(socket);
			// broadcast(`bye! ${socket.conn.rid}`);
			break;
		} else {
			console.log('on_message function')
			if ('on_message' in ctx) {
				await ctx.on_message(ev, _context);
			}
			// broadcast(ev);
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
