export class Context {
	private headers?: Headers;
	private status?: number;
	private next?: Function;
	private ctx?: any;

	private static next?: Function;
	private static ctx?: any;

	public static create(ctx?: any, next?: Function): Context {
		if (ctx !== undefined) {
			this.ctx = ctx;
		}
		if (next !== undefined) {
			this.next = next;
		}
		return new Context(this.ctx, this.next);
	}

	private constructor(context?: any, next?: Function) {
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
