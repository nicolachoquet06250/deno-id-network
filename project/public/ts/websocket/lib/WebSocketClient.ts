import { EVENTS, MESSAGE_TYPE } from "../../../../lib/common/mod.ts";

type Listeners = Map<EVENTS, Function | Map<MESSAGE_TYPE, Function>>;

export class WebSocketClient {
	private readonly socket?: WebSocket;
	private listeners: Listeners = new Map<EVENTS, Function | Map<MESSAGE_TYPE, Function>>();
	private channel_listeners: Map<string, Function> = new Map<string, Function>();

	constructor(
		private hostname: string,
		private port?: number,
		private secure: boolean = true,
		private route: string = '/'
	) {
		this.socket = new WebSocket(`${this.secure ? 'wss' : 'ws'}://${this.hostname}${this.port ? `:${this.port}` : ''}${this.route}`);
	}

	public on(eventName: EVENTS, event: Function, messageType: MESSAGE_TYPE = MESSAGE_TYPE.TEXT): WebSocketClient {
		if (eventName === EVENTS.MESSAGE) {
			if (this.listeners.has(eventName)) {
				// @ts-ignore
				this.listeners.get(eventName).set(messageType, event);
			} else {
				const map = new Map<MESSAGE_TYPE, Function>();
				map.set(messageType, event);
				this.listeners.set(eventName, map);
			}
		} else {
			this.listeners.set(eventName, event);
		}
		return this;
	}

	public on_channel(channelName: string, event: Function): WebSocketClient {
		this.channel_listeners.set(channelName, event);
		return this;
	}

	private dispatch(eventName: EVENTS, params: Record<string, any>, messageType?: MESSAGE_TYPE) {
		if (this.listeners.has(eventName)) {
			const func: Function | Map<MESSAGE_TYPE, Function> | undefined = this.listeners.get(eventName);

			if (func) {
				if (typeof func === "function") {
					func(params);
				}
				else if (eventName === EVENTS.MESSAGE
					&& func instanceof Map
					&& messageType && func.has(messageType)) {
					const sub_func: Function | undefined = func.get(messageType);

					if (sub_func) {
						sub_func(params)
					}
				}
			}
		}
	}

	public listen() {
		if (this.socket) {
			this.socket.addEventListener(EVENTS.OPEN, (e: any) => {
				this.dispatch(EVENTS.OPEN, { event: e });
			});
			this.socket.addEventListener(EVENTS.CLOSE, (e: any) => {
				this.dispatch(EVENTS.CLOSE, { event: e });
			});
			this.socket.addEventListener(EVENTS.MESSAGE, async (e: any) => {
				switch(typeof e.data) {
					case 'string':
						try {
							const json = JSON.parse(e.data);
							if ('channel' in json && this.channel_listeners.has(json.channel)) {
								const channel = json.channel;
								delete json.channel;
								const func = this.channel_listeners.get(channel);
								if (func) func(json)
							} else {
								this.dispatch(EVENTS.MESSAGE, { event: e, message: json }, MESSAGE_TYPE.JSON);
							}
						} catch (err) {
							this.dispatch(EVENTS.MESSAGE, { event: e, message: e.data }, MESSAGE_TYPE.TEXT);
						}
						break;
					case 'object':
						const ab = await e.data.arrayBuffer();
						// console.log(new Uint8Array(ab));
						this.dispatch(
							EVENTS.MESSAGE,
							{ event: e, message: new Uint8Array(ab) },
							MESSAGE_TYPE.BUFFER
						);
						break;
				}
			});
			this.socket.addEventListener(EVENTS.ERROR, (e: any) => {
				this.dispatch(EVENTS.ERROR, { error: e });
			});
		}
	}

	public send(message: string|Record<string, any>) {
		if (this.socket) {
			if (typeof message === "string"
				|| message instanceof ArrayBuffer
				|| message instanceof Blob) {
				this.socket.send(message);
			} else {
				this.socket.send(JSON.stringify(message));
			}
		}
	}

	public send_channel(channel: string, message: string|Record<string, any>) {
		let _message;
		if (typeof message === "string") {
			_message = { channel, message };
		} else {
			_message = { channel, ...message };
		}
		this.send(_message)
	}

	public close() {
		if (this.socket) {
			this.socket.close();
		}
	}
}
