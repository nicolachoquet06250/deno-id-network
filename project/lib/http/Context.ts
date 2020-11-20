import { WebSocket } from "../middlewares/websocket/mod.ts";

export class Context {
	protected headers?: Headers;
	protected status?: number;
	protected next?: Function;
	protected ctx?: any;

	protected static next?: Function;
	protected static ctx?: any;

	public static create(ctx?: any, next?: Function): Context {
		if (ctx !== undefined) {
			this.ctx = ctx;
		}
		if (next !== undefined) {
			this.next = next;
		}
		return new Context(this.ctx, this.next);
	}

	protected constructor(context?: any, next?: Function) {
		this.ctx = context;
		this.next = next;
	}

	public respond(body: any, headers: Headers = new Headers(), status: number = 200): void {
		this.ctx.response.status = this.status ?? status;
		this.ctx.response.headers = this.headers ?? headers;
		this.ctx.response.body = body;

		if (this.next) {
			const next = this.next;
			next();
		}
	}

	public init_headers(headers: Record<string, string>): Context {
		this.headers = new Headers(headers);
		return this;
	}

	public header(key: string, value: string): Context {
		if (!this.headers) {
			this.headers = new Headers();
		}
		this.headers.append(key, value);
		return this;
	}

	public set_status(status: number): Context {
		this.status = status;
		return this;
	}

	public has_param(key: string): boolean {
		return Object.keys(this.ctx.params).indexOf(key) !== -1;
	}

	public params(): Record<string, string> {
		return this.ctx.params;
	}

	public param(key: string): string {
		return this.ctx.params[key];
	}

	public request(): any {
		return this.ctx.request;
	}
}

type Users = Set<WebSocket>;

export class WSContext extends Context {
	public users?: Users;
	public socket?: WebSocket;
	public user_id?: number;

	public static users?: Users;
	public static socket?: WebSocket;
	public static user_id?: number;

	public get user(): WebSocket {
		// @ts-ignore
		return Array.from(this.users)
			.reduce((reducer: WebSocket, current: WebSocket) => {
				if (current.conn.rid === this.user_id) {
					reducer = current;
				}
				return reducer;
			});
	}

	public get broadcast(): { send: Function } {
		const that = this;
		return {
			send(message: string) {
				if (that.users) {
					that.users.forEach((user: WebSocket) => {
						if (user.conn.rid !== that.user_id) {
							user.send(message);
						}
					});
				}
			}
		};
	}

	public static create(ctx?: any, next?: Function, socket?: WebSocket, users?: Users, user_id?: number): Context {
		if (ctx !== undefined) this.ctx = ctx;
		if (next !== undefined) this.next = next;
		if (users !== undefined) this.users = users;
		if (socket !== undefined) this.socket = socket;
		if (user_id !== undefined) this.user_id = user_id;

		return new WSContext(this.ctx, this.next, this.socket, this.users, this.user_id);
	}

	protected constructor(context?: any, next?: Function, socket?: WebSocket, users?: Users, user_id?: number) {
		super(context, next);

		this.users = users;
		this.socket = socket;
		this.user_id = user_id;
	}
}
