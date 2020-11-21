import { InjectedProperty, Websocket, WSInit } from "../../lib/decorators/mod.ts";
import { WSContext } from "../../lib/http/mod.ts";
import { User } from "../models/mod.ts";

@Websocket('/messages')
export class Messages {

	@InjectedProperty({ type: WSContext })
	private context?: WSContext;

	@WSInit
	public async on_connect() {
		console.log('on_connect |', 'You are connected');
	}

	public async on_disconnect() {
		if (this.context) {
			this.context.broadcast.send_channel('disconnect', {})
		}
		console.log('on_disconnect |', 'Bye');
	}

	public async on_channel_new_connexion(json: Record<string, any>) {
		if (this.context) {
			const userName = json.user.name;

			// @ts-ignore
			const users: User[] = await User.from({ name: userName });
			if (users.length === 0) {
				this.context.user.send_channel('new_connexion', {
					error: true,
					message: 'Vos identifiants sont incorrects'
				})
			} else {
				const user: User = users[0];

				// @ts-ignore
				this.context.broadcast.send_channel('new_connexion', { user: user.toJson() })
				this.context.user.send_channel('new_connexion', { error: false })
			}
		}
	}

	public async on_channel_already_connected(json: Record<string, any>) {
		if (this.context) {
			this.context.broadcast.send_channel('already_connected', json);
		}
	}

	public async on_json(json: Record<string, any>) {
		if (this.context) {
			this.context.user.send({
				function: 'on_message',
				type: 'json',
				message: json
			});
		}
	}
}
