// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { serve } from "https://deno.land/std@0.78.0/http/server.ts";
import {
	acceptWebSocket, isWebSocketPingEvent,
	isWebSocketCloseEvent, WebSocket
} from "https://deno.land/std@0.78.0/ws/mod.ts";

export enum EVENTS {
	ABORT = 'abort',
	OPEN = 'open',
	ERROR = 'error',
	CLOSE = 'close',
	MESSAGE = 'message'
}

export enum MESSAGE_TYPE {
	JSON = 'json',
	TEXT = 'text',
	BINARY = 'binary',
	PING = 'ping',
	CLOSE = 'close'
}

export type OpenEvent = { socket: WebSocket };
export type ErrorEvent = { error: any, message: string };
export type MessageEvent = {
	type: MESSAGE_TYPE,
	message: Record<string, any> | string | Uint8Array | any,
	socket: WebSocket
}
export type CloseEvent = ErrorEvent | MessageEvent;

export class WebSocketServer {
	private listeners: Map<string, Function> = new Map<string, Function>();
	private users: Array<WebSocket> = [];

	constructor(
		private ip: string,
		private port: number
	) {}

	public async serve() {
		for await (const req of serve(`${this.ip}:${this.port}`)) {
			const { conn, r: bufReader, w: bufWriter, headers } = req;

			try {
				const sock = await acceptWebSocket({
					conn,
					bufReader,
					bufWriter,
					headers,
				})

				this.dispatch(EVENTS.OPEN, { socket: sock });

				try {
					for await (const ev of sock) {
						if (typeof ev === "string") {
							try {
								const json = JSON.parse(ev.toString());
								this.dispatch(EVENTS.MESSAGE, { type: MESSAGE_TYPE.JSON, message: json, socket: sock });
							} catch (err) {
								this.dispatch(EVENTS.MESSAGE, { type: MESSAGE_TYPE.TEXT, message: ev, socket: sock })
							}
						}
						else if (ev instanceof Uint8Array) {
							this.dispatch(EVENTS.MESSAGE, { type: MESSAGE_TYPE.BINARY, message: ev, socket: sock })
						}
						else if (isWebSocketPingEvent(ev)) {
							const [, body] = ev;
							this.dispatch(EVENTS.MESSAGE, { type: MESSAGE_TYPE.PING, message: body, socket: sock })
						}
						else if (isWebSocketCloseEvent(ev)) {
							const { code, reason } = ev;
							this.dispatch(EVENTS.CLOSE, {
								type: MESSAGE_TYPE.CLOSE,
								message: { code, reason },
								socket: sock
							})
						}
					}
				} catch (err) {
					this.dispatch(EVENTS.ERROR, {
						error: err,
						message: `failed to receive frame: ${err}`
					});
					console.error(`failed to receive frame: ${err}`);

					if (!sock.isClosed) {
						await sock.close(1000).catch(e => {
							this.dispatch(EVENTS.CLOSE, {
								error: e,
								message: e.message
							});
							console.error(e)
						});
					}
				}
			} catch (err) {
				this.dispatch(EVENTS.ABORT, {
					error: err,
					message: `failed to accept websocket: ${err}`
				});
				console.error(`failed to accept websocket: ${err}`);
				await req.respond({ status: 400 });
			}
		}
	}

	public addEventListener(eventName: string, listener: Function) {
		this.listeners.set(eventName, listener);
	}

	public removeEventListener(eventName: string) {
		this.listeners.delete(eventName);
	}

	public dispatch(eventName: string, params: Record<string, any> = {}) {
		if (this.listeners.has(eventName)) {
			const func: Function|undefined = this.listeners.get(eventName);
			if (func) func(params);
		}
	}
}
