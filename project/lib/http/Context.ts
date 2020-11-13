export class Context {
	private headers?: Headers;
	private status?: number;
	private next?: Function;

	private static instance?: Context;

	public static create(ctx?: any): Context {
		if (!this.instance) {
			this.instance = new Context(ctx);
		}
		return this.instance;
	}

	public static reset() {
		this.instance = undefined;
	}

	private constructor(private ctx: any) {
		this.ctx = ctx;
	}

	public set_next(next: Function) {
		this.next = next;
	}

	public respond(body: any, headers: Headers = new Headers(), status: number = 200) {
		this.status = this.status ?? status;
		this.headers = this.headers ?? headers;
		this.ctx.response = { status: this.status, headers: this.headers, body };

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

	public has_param(key: string) {
		return Object.keys(this.ctx.params).indexOf(key) !== -1;
	}

	public params() {
		return this.ctx.params;
	}

	public param(key: string) {
		return this.ctx.params[key];
	}

	public request() {
		return this.ctx.request;
	}

}
