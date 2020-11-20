import { InjectedProperty, Websocket, WSInit } from "../../lib/decorators/mod.ts";
import { WSContext } from "../../lib/http/mod.ts";

@Websocket('/messages')
export class Messages {

	@InjectedProperty({ type: WSContext })
	private context?: WSContext;

	@WSInit
	public async on_connect() {
		if (this.context) {
			// console.log('on_connect', this.context.socket);
			console.log('on_connect |', 'You are connected');
			this.context.user.send('Hello World ' + this.context.user_id);
			this.context.broadcast.send('Hello World de ' + this.context.user_id);
		}
	}

	public async on_disconnect() {
		if (this.context) {
			console.log('on_disconnect |', 'Bye');
			// console.log('on_disconnect |', this.context.socket);
		}
	}

	public async on_message(message: string) {
		if (this.context) {
			// console.log('on_message', this.context.socket);
			this.context.user.send('on_message | ' + message)
		}
	}
}
