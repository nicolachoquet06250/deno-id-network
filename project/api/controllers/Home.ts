import { Controller, Get } from "../../lib/decorators/http.ts";

@Controller()
export class Home {

	@Get()
	@Get('/home')
	@Get('/home/test')
	public async get(context: any) {
		context.response.body = {
			page: 'home'
		}
	}
}
