import { InjectedProperty, Websocket, WSInit } from "../../lib/decorators/mod.ts";
import { WSContext } from "../../lib/http/mod.ts";
import { User } from "../models/mod.ts";
import { Channel, Event } from "../../lib/decorators/websocket.ts";
import { CHANNELS, MESSAGE_TYPE } from "../../lib/common/mod.ts";

@Websocket('/messages')
export class Messages {

	@InjectedProperty({ type: WSContext })
	private context?: WSContext;

	@WSInit
	public async on_connect() {
		console.log('on_connect |', 'You are connected');
	}

	@Event(CHANNELS.DISCONNECT)
	public async on_disconnect() {
		if (this.context) {
			this.context.broadcast.send_channel(CHANNELS.DISCONNECT, {
				socket_id: this.context.user_id
			})
		}
		console.log('on_disconnect |', 'Bye');
	}

	@Channel(CHANNELS.NEW_CONNEXION)
	public async on_new_connexion(json: Record<string, any>) {
		if (this.context) {
			const userName = json.user.name;

			// @ts-ignore
			const users: User[] = await User.from({ name: userName });
			if (users.length === 0) {
				this.context.user.send_channel(CHANNELS.NEW_CONNEXION, {
					error: true,
					message: 'Vos identifiants sont incorrects'
				})
			} else {
				const user: User = users[0];

				this.context.broadcast.send_channel(CHANNELS.NEW_CONNEXION, {
					// @ts-ignore
					user: user.toJson(),
					socket_id: this.context.user_id
				})
				this.context.user.send_channel(CHANNELS.NEW_CONNEXION, { error: false })
			}
		}
	}

	@Channel(CHANNELS.ALREADY_CONNECTED)
	public async on_already_connected(json: Record<string, any>) {
		if (this.context) {
			this.context.broadcast.send_channel(CHANNELS.ALREADY_CONNECTED, {
				...json,
				socket_id: this.context.user_id
			});
		}
	}

	@Channel(CHANNELS.MESSAGE)
	public async on_message(json: { message: string, date: Date }) {
		if (this.context) {
			this.context.broadcast.send_channel(CHANNELS.MESSAGE, json);
		}
	}

	@Channel(CHANNELS.IS_WRITTEN)
	public async on_written(json: { status: boolean }) {
		if (this.context) {
			this.context.broadcast.send_channel(CHANNELS.IS_WRITTEN, json);
		}
	}

	@Event(MESSAGE_TYPE.JSON)
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
