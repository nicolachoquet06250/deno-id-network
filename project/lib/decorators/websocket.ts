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

export const Channel = (name: string) => (target: {} | any, propertyKey: PropertyKey) => {
	let channels = WebsocketRouter._channelsPerRoute.has(target.constructor.name)
		? WebsocketRouter._channelsPerRoute.get(target.constructor.name) : new Map<string, string>();
	if (channels) {
		channels.set(name, propertyKey.toString());
		WebsocketRouter._channelsPerRoute.set(target.constructor.name, channels);
	}
}

export const Event = (name: string) => (target: {} | any, propertyKey: PropertyKey) => {
	let events = WebsocketRouter._eventsPerRoute.has(target.constructor.name)
		? WebsocketRouter._eventsPerRoute.get(target.constructor.name) : new Map<string, string>();
	if (events) {
		events.set(name, propertyKey.toString());
		WebsocketRouter._eventsPerRoute.set(target.constructor.name, events);
	}
}
