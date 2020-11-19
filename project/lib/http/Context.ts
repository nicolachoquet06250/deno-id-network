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

export class WSContext extends Context {
	public users?: Map<string, WebSocket>;
	public socket?: WebSocket;
	public user_id?: string;

	public static users?: Map<string, WebSocket>;
	public static socket?: WebSocket;
	public static user_id?: string;

	public get user(): WebSocket|null {
		let users = undefined;
		if (this.users) {
			users = this.users;
		}
		let user = undefined;
		if (users && this.user_id) {
			user = users.get(this.user_id);
		}
		if (user) return user;
		return null;
	}

	public static create(ctx?: any, next?: Function, socket?: WebSocket, users?: Map<string, WebSocket>, user_id?: string): Context {
		if (ctx !== undefined) this.ctx = ctx;
		if (next !== undefined) this.next = next;
		if (users !== undefined) this.users = users;
		if (socket !== undefined) this.socket = socket;
		if (user_id !== undefined) this.user_id = user_id;

		return new WSContext(this.ctx, this.next, this.socket, this.users, this.user_id);
	}

	protected constructor(context?: any, next?: Function, socket?: WebSocket, users?: Map<string, WebSocket>, user_id?: string) {
		super(context, next);

		this.users = users;
		this.socket = socket;
		this.user_id = user_id;
	}

	public broadcast(message: string) {
		if (!this.users) throw new Error('the users set is not defined !');

		for (const user of this.users.values()) {
			user.send(this.user_id ? `[${this.user_id}]: ${message}` : message);
		}
	}

	public send(message: any) {
		if (!this.users || !this.user_id) throw new Error('the users set is not defined !');

		let user: WebSocket|null;
		if ((user = this.user)) {
			user.send(message);
		}
	}
}
