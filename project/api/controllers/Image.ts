import { exists } from "https://deno.land/std@0.61.0/fs/mod.ts";
import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import { CustomRouter, Context } from "../../lib/http/mod.ts";

@Controller('/img')
export class Image {
	@InjectedProperty({ type: CustomRouter })
	public router?: CustomRouter;

	@InjectedProperty({ type: Context })
	public context?: Context;

	@Get('/uploads/:name.:ext', 'uploaded_images')
	public async get_uploaded_images() {
		if (this.context) {
			if (this.context.params && this.context.has_param('name') && this.context.has_param('ext')) {
				// @ts-ignore
				const image_path = `${Deno.cwd()}/project/uploads/${this.context.params.name}.${this.context.params.ext}`;

				if (await exists(image_path)) {
					this.context.init_headers({'content-type': 'image/png'});
					// @ts-ignore
					this.context.respond(await Deno.readFile(image_path));
				} else {
					if (this.router) {
						// @ts-ignore
						const {DOMAIN} = Deno.env.toObject();

						this.context.set_status(404).respond({
							status: 'error',
							code: 404,
							message: `Image ${(DOMAIN ? DOMAIN : this.context.request().url.origin) + this.router.url('uploaded_images', {
								name: this.context.param('name'),
								ext: this.context.param('ext')
							})} not found !`
						});
					}
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
}
