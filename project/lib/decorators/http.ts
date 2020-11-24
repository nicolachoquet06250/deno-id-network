import { CustomRouter } from "../http/mod.ts";

import { getParams, HTTP_METHODS } from "../common/mod.ts";

export { getParams, HTTP_METHODS };

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
			httpMethod: HTTP_METHODS.GET,
			route: route,
			callback: propertyKey,
			target,
			name
		});
	};

export const Post = (route: string = '/', name?: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		CustomRouter._routes.push({
			httpMethod: HTTP_METHODS.POST,
			route: route,
			callback: propertyKey,
			target,
			name
		});
	};

export const Delete = (route: string = '/', name?: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		CustomRouter._routes.push({
			httpMethod: HTTP_METHODS.DELETE,
			route: route,
			callback: propertyKey,
			target,
			name
		});
	};

export const Put = (route: string = '/', name?: string) =>
	(target: {} | any, propertyKey: PropertyKey) => {
		CustomRouter._routes.push({
			httpMethod: HTTP_METHODS.PUT,
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
