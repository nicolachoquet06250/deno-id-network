import { exists } from "https://deno.land/std@0.61.0/fs/mod.ts";
import { Controller, Get } from "../../lib/decorators/http.ts";
import { InjectedProperty } from "../../lib/decorators/dis.ts";
import { CustomRouter } from "../../lib/http/Router.ts";

@Controller('/img')
export class Image {
	@InjectedProperty({ type: CustomRouter })
	public router?: CustomRouter;

	@Get('/uploads/:name.:ext', 'uploaded_images')
	public async get_uploaded_images(ctx: any, next: Function) {
		if (ctx.params && ctx.params.name && ctx.params.ext) {
			// @ts-ignore
			const image_path = `${Deno.cwd()}/project/uploads/${ctx.params.name}.${ctx.params.ext}`;

			if (await exists(image_path)) {
				// @ts-ignore
				const img = await Deno.readFile(image_path);

				const head = new Headers();
				head.set('content-type', 'image/png');

				ctx.response.headers = head;
				ctx.response.body = img;
			} else {
				if (this.router) {
					// @ts-ignore
					const { DOMAIN } = Deno.env.toObject();

					ctx.response.status = 404;
					ctx.response.body = {
						status: 'error',
						code: 404,
						message: `Image ${(DOMAIN ? DOMAIN : ctx.request.url.origin) + this.router.url('uploaded_images', {
							name: ctx.params.name,
							ext: ctx.params.ext
						})} not found !`
					};
				}
			}
		} else {
			ctx.response.status = 400;
			ctx.response.body = {
				status: 'error',
				code: 400,
				message: 'Bad Request'
			};
		}
	}
}
