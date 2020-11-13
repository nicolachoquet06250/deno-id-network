import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import { Context } from "../../lib/http/mod.ts";

@Controller()
export class Home {

	@InjectedProperty({ type: Context })
	private context?: Context;

	@Get()
	@Get('/home')
	@Get('/home/test')
	public async get() {
		if (this.context) {
			this.context.respond({
				page: 'home'
			});
		}
	}
}
