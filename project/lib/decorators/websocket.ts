import { HttpMethod, WebsocketRouter } from "../http/Router.ts";

export const Websocket = (route: string = '') => (target: {} | any) => {
	WebsocketRouter._groupUrls.set(target.name, route);
}

export const WSInit = (target: {} | any, propertyKey: PropertyKey) => {
	WebsocketRouter._routes.push({
		httpMethod: HttpMethod.GET,
		route: '',
		callback: propertyKey,
		target
	});
}
