import { Home, User, Image } from "./controllers/mod.ts";

const controllers = [ Home, User, Image ];

export const getAllRoutes = () => {
	return controllers;
}

