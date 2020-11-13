import { CustomRouter, HttpMethod } from "../http/mod.ts";

export function getParams(func: Function) {
	const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	const ARGUMENT_NAMES = /([^\s,]+)/g;

	let fnStr = func.toString().replace(STRIP_COMMENTS, '');
	let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	if(result === null) result = [];
	return result;
}

/*******************************************************************************/
/* Paramétrage du type de classe ***********************************************/
/*******************************************************************************/

export const Controller = (route: string = '') =>
	(target: any) => {
		CustomRouter._groupUrls[target.name] = route;
	};

/*******************************************************************************/
/* Paramétrage de la méthode http **********************************************/
/*******************************************************************************/

export const Get = (route: string = '/', name?: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		CustomRouter._routes.push({
			httpMethod: HttpMethod.GET,
			route: route,
			callback: propertyKey,
			target,
			name
		});
	};

export const Post = (route: string = '/', name?: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		CustomRouter._routes.push({
			httpMethod: HttpMethod.POST,
			route: route,
			callback: propertyKey,
			target,
			name
		});
	};

export const Delete = (route: string = '/', name?: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		CustomRouter._routes.push({
			httpMethod: HttpMethod.DELETE,
			route: route,
			callback: propertyKey,
			target,
			name
		});
	};

export const Put = (route: string = '/', name?: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		CustomRouter._routes.push({
			httpMethod: HttpMethod.PUT,
			route: route,
			callback: propertyKey,
			target,
			name
		});
	};

/*******************************************************************************/
/* Gestion de l'upload *********************************************************/
/*******************************************************************************/

export const Upload = (directory: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		for (let route of CustomRouter._routes) {
			if (route.callback === propertyKey) {
				route.upload = directory;
				break;
			}
		}
	};
