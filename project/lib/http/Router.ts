import { Router } from "https://deno.land/x/oak/mod.ts";
import { DependencyInjection } from "../dis/DependencyInjection.ts";
import { upload } from "../middlewares/upload/mod.ts";
import { Context } from "./mod.ts";

export enum HttpMethod {
	GET = 'get',
	POST = 'post',
	PUT = 'put',
	DELETE = 'delete',
}

export interface Route {
	httpMethod: HttpMethod
	route: string
	callback: Function | any,
	target: any,
	name?: string,
	upload?: string
}

export class CustomRouter {
	private static _instance?: Router;
	static get instance(): Router {
		if (!this._instance) {
			this._instance = new Router();
		}
		return this._instance;
	}

	public static _routes: Array<Route> = []

	public static _groupUrls: Record<string, string> = {}

	private static routeNames: Record<string, { route: string, method: string }> = {}

	public get(route: string, callback: any) {
		return CustomRouter.instance.get(route, callback);
	}

	public post(route: string, callback: any, uploadDirectory?: string) {
		if (uploadDirectory) {
			return CustomRouter.instance.post(route, upload(uploadDirectory), callback);
		}
		return CustomRouter.instance.post(route, callback);
	}

	public put(route: string, callback: any, uploadDirectory?: string) {
		if (uploadDirectory) {
			return CustomRouter.instance.put(route, upload(uploadDirectory), callback);
		}
		return CustomRouter.instance.put(route, callback);
	}

	public delete(route: string, callback: any) {
		return CustomRouter.instance.delete(route, callback);
	}

	public routes() {
		for (let route of CustomRouter._routes) {
			let httpMethod: string;
			switch (route.httpMethod) {
				case HttpMethod.GET:
				case HttpMethod.POST:
				case HttpMethod.PUT:
				case HttpMethod.DELETE:
					httpMethod = route.httpMethod;
					break;
				default:
					httpMethod = HttpMethod.GET;
					break;
			}
			let methodToCall: Function;
			eval(`methodToCall = this.${httpMethod};`);

			// console.log(route)
			// @ts-ignore
			methodToCall(CustomRouter._groupUrls[route.target.constructor.name] + route.route, async (context: any) => {
				const target = route.target.constructor;
				const callback = route.callback;

				Context.create(context);

				const ctx = DependencyInjection.instantiateType(target);
				await ctx[callback](Context.create());

				Context.reset();
			}, route.upload);
			if (route.route === '/' && CustomRouter._groupUrls[route.target.constructor.name] !== '') {
				// @ts-ignore
				methodToCall(CustomRouter._groupUrls[route.target.constructor.name], async (context: any) => {
					const target = route.target.constructor;
					const callback = route.callback;

					Context.create(context);

					const ctx = DependencyInjection.instantiateType(target);
					await ctx[callback](Context.create());

					Context.reset();
				}, route.upload);
			}
			if (route.name) {
				CustomRouter.routeNames[route.name] = {
					route: `${CustomRouter._groupUrls[route.target.constructor.name]}${route.route}`,
					method: httpMethod
				}
			}
		}
		return CustomRouter.instance.routes();
	}

	public allowedMethods() {
		return CustomRouter.instance.allowedMethods();
	}

	public url(name: string, params?: Record<string, string|number>) {
		if (CustomRouter.routeNames[name]) {
			let route = CustomRouter.routeNames[name].route;
			if (params) {
				for (let param of Object.keys(params)) {
					route = route.replace(new RegExp(`\:${param}`), params[param].toString())
				}
			}
			return route;
		}
		throw new Error(`route named ${name} not found !`);
	}
}
