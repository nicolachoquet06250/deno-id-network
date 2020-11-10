import { Controller, Get } from "../../lib/decorators/http.ts";
import { User as UserModel } from "../../api/models/User.ts";
import { CustomRouter } from "../../lib/http/Router.ts";
import { ConstructorInjection, InjectedProperty, InjectedParameter } from "../../lib/decorators/dis.ts";

@ConstructorInjection()
@Controller('/user')
export class User {
	@InjectedProperty({
		type: CustomRouter
	})
	public router?: CustomRouter;

	constructor(
		@InjectedParameter({
			type: CustomRouter
		})
		private test: CustomRouter
	) {}

	@Get('/:id', 'user')
	public async get(context: any) {
		if (context.params && context.params.id) {
			// @ts-ignore
			const user: UserModel|boolean = await UserModel.from({
				id: parseInt(context.params.id)
			});

			if (user) {
				const url = this.test ? context.request.url.origin + this.test.url('user', { id: parseInt(context.params.id) + 1 }) : '';
				context.response.body = { user, next_user_id: url };
			} else {
				context.response.status = 404;
				context.response.body = {
					status: 'error',
					code: 404,
					message: 'Page not found'
				}
			}
		} else {
			context.response.status = 404;
			context.response.body = {
				status: 'error',
				code: 404,
				message: 'Page not found'
			}
		}
	}

	@Get('s')
	public async getAll(context: any) {
		// @ts-ignore
		context.response.body = await UserModel.getAll();
	}
}
