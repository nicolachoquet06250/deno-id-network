import { Controller, Get, Post, Put, Delete } from "../../lib/decorators/http.ts";

@Controller('/home')
export class Home {
	@Get('/test')
	@Get()
	public async get(context: any) {
		context.response.body = {
			page: 'home'
		}
	}

	// @Post()
	public post(context: any) {
		context.response.body = {
			http: 'post',
			page: 'home'
		}
	}

	// @Put()
	public put(context: any) {
		context.response.body = {
			http: 'put',
			page: 'home'
		}
	}

	// @Delete()
	public delete(context: any) {
		context.response.body = {
			http: 'delete',
			page: 'home'
		}
	}
}
