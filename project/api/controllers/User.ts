import "https://deno.land/x/dotenv/load.ts";

import { Controller, Delete, Get, Post, Put, Upload } from "../../lib/decorators/http.ts";
import { User as UserModel } from "../../api/models/User.ts";
import { CustomObject } from "../../lib/decorators/db.ts";
import { CustomRouter } from "../../lib/http/Router.ts";
import { ConstructorInjection, InjectedProperty, InjectedParameter } from "../../lib/decorators/dis.ts";

@ConstructorInjection()
@Controller('/user')
export class User {
	@InjectedProperty({ type: CustomRouter })
	public router?: CustomRouter;

	constructor(
		@InjectedParameter({ type: CustomRouter })
		private test: CustomRouter
	) {}

	@Get('/:id', 'user')
	public async get(context: any) {
		// @ts-ignore
		const { DOMAIN } = Deno.env.toObject();

		if (context.params && context.params.id) {
			// @ts-ignore
			const user: UserModel|boolean = await UserModel.from({
				id: parseInt(context.params.id)
			});

			if (user) {
				const url = this.test ? (DOMAIN ? DOMAIN : context.request.url.origin) + this.test.url('user', { id: parseInt(context.params.id) + 1 }) : '';
				// @ts-ignore
				context.response.body = { user: user.toJson(), next_user_id: url };
			} else {
				context.response.status = 404;
				context.response.body = {
					status: 'error',
					code: 404,
					message: 'User not found'
				}
			}
		} else {
			context.response.status = 400;
			context.response.body = {
				status: 'error',
				code: 400,
				message: 'Bad Request'
			}
		}
	}

	@Get('s', 'users')
	public async getAll(context: any) {
		// @ts-ignore
		context.response.body = (await UserModel.getAll())
			// @ts-ignore
			.map((u: UserModel) => u.toJson());
	}

	@Post('', 'add_user')
	public async addOne(context: any) {
		const body = await context.request.body().value;

		if ('created_at' in Object.keys(body)) {
			body.created_at = new Date();
		}

		console.log(body);
		// @ts-ignore
		const user: UserModel = await UserModel.create(...CustomObject.values(body));
		if (user) {
			// @ts-ignore
			context.response.body = user.toJson();
		} else {
			context.response.status = 500;
			context.response.body = {
				status: 'error',
				code: 500,
				message: 'Server Internal Error'
			}
		}
	}

	@Put('/:id', 'update_user')
	public async update(context: any) {
		if (context.params && context.params.id) {
			const id: number = parseInt(context.params.id);
			const body = await context.request.body().value;

			// @ts-ignore
			const user: UserModel = await UserModel.from({ id });

			if (user) {
				for (let key of Object.keys(body)) {
					// @ts-ignore
					user[key] = body[key];
				}
				// @ts-ignore
				user.save();
			}

			// @ts-ignore
			context.response.body = user.toJson();
		}
	}

	@Delete('/:id', 'delete_user')
	public async remove(context: any) {
		if (context.params && context.params.id) {
			const id = parseInt(context.params.id);
			// @ts-ignore
			const user: UserModel = await UserModel.from({ id });

			// @ts-ignore
			const removed: boolean = await user.remove();
			if (user) {
				if (removed) {
					context.response.body = {
						deleted: true,
						user_id: id
					}
				} else {
					context.response.body = {
						deleted: false
					}
				}
			} else {
				context.response.status = 404;
				context.response.body = {
					status: 'error',
					code: 404,
					message: 'User not found'
				}
			}
		} else {
			context.response.status = 400;
			context.response.body = {
				status: 'error',
				code: 400,
				message: 'Bad Request'
			}
		}
	}
}
