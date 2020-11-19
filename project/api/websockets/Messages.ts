import { InjectedProperty, Websocket, WSInit } from "../../lib/decorators/mod.ts";
import { WSContext } from "../../lib/http/mod.ts";
import { WebSocket } from "../../lib/middlewares/websocket/mod.ts";

@Websocket('/messages')
export class Messages {

	@InjectedProperty({ type: WSContext })
	private context?: WSContext;

	@WSInit
	public async on_connect() {
		console.log(this.context);
		if (this.context && this.context.socket) {
			const socket: WebSocket = this.context.socket;
			this.context.send('Hello World');
			console.log(socket);
		}
	}

	public async on_disconnect() {
		if (this.context && this.context.socket) {
			const socket: WebSocket = this.context.socket;
			console.log(socket);
		}
	}

	public async on_message(message: string) {
		if (this.context && this.context.socket) {
			const socket: WebSocket = this.context.socket;
			console.log(socket, message);
		}
	}
}
