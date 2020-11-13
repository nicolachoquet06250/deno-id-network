import "https://deno.land/x/dotenv/load.ts";

import {
	Controller, Delete, Get, Post, Put, Upload,
	InjectedProperty,
	CustomObject
} from "../../lib/decorators/mod.ts";
import { User as UserModel } from "../../api/models/mod.ts";
import { Context, CustomRouter } from "../../lib/http/mod.ts";

@Controller('/user')
export class User {
	@InjectedProperty({ type: CustomRouter })
	public router?: CustomRouter;

	@InjectedProperty({ type: Context })
	private context?: Context;

	@Get('/:id', 'user')
	public async get() {
		// @ts-ignore
		const { DOMAIN } = Deno.env.toObject();

		if (this.context) {
			if (this.context.has_param('id')) {
				// @ts-ignore
				const user: UserModel | boolean = await UserModel.from({
					id: parseInt(this.context.param('id'))
				});

				if (user) {
					const url = this.router ? (DOMAIN ? DOMAIN : this.context.request().url.origin) + this.router.url('user', {
						id: parseInt(this.context.param('id')) + 1
					}) : '';
					// @ts-ignore
					this.context.respond({user: user.toJson(), next_user_id: url});
				} else {
					this.context.set_status(404).respond({
						status: 'error',
						code: 404,
						message: 'User not found'
					});
				}
			} else {
				this.context.set_status(400).respond({
					status: 'error',
					code: 400,
					message: 'Bad Request'
				});
			}
		}
	}

	@Get('s', 'users')
	public async getAll() {
		if (this.context) {
			// @ts-ignore
			this.context.respond((await UserModel.getAll())
				// @ts-ignore
				.map((u: UserModel) => u.toJson()));
		}
	}

	@Post('', 'add_user')
	public async addOne() {
		if (this.context) {
			const body = await this.context.request().body().value;

			if ('created_at' in Object.keys(body)) {
				body.created_at = new Date();
			}

			// @ts-ignore
			const user: UserModel = await UserModel.create(...CustomObject.values(body));
			if (user) {
				// @ts-ignore
				this.context.respond(user.toJson());
			} else {
				this.context.set_status(500).respond({
					status: 'error',
					code: 500,
					message: 'Server Internal Error'
				});
			}
		}
	}

	@Put('/:id', 'update_user')
	public async update() {
		if (this.context) {
			if (this.context.has_param('id')) {
				const id: number = parseInt(this.context.param('id'));
				const body = await this.context.request().body().value;

				// @ts-ignore
				const user: UserModel = await UserModel.from({id});

				if (user) {
					for (let key of Object.keys(body)) {
						// @ts-ignore
						user[key] = body[key];
					}
					// @ts-ignore
					user.save();
				}

				// @ts-ignore
				this.context.respond(user.toJson());
			}
		}
	}

	@Delete('/:id', 'delete_user')
	public async remove() {
		if (this.context) {
			if (this.context.has_param('id')) {
				const id = parseInt(this.context.param('id'));
				// @ts-ignore
				const user: UserModel = await UserModel.from({id});

				// @ts-ignore
				const removed: boolean = await user.remove();
				if (user) {
					if (removed) {
						this.context.respond({ deleted: true, user_id: id });
					} else {
						this.context.respond({ deleted: false });
					}
				} else {
					this.context.set_status(404).respond({
						status: 'error',
						code: 404,
						message: 'User not found'
					});
				}
			} else {
				this.context.set_status(400).respond({
					status: 'error',
					code: 400,
					message: 'Bad Request'
				});
			}
		}
	}

	@Upload('project/uploads')
	@Post('/toto/up')
	public async upload() {
		if (this.context) {
			this.context.respond({});
		}
	}
}
