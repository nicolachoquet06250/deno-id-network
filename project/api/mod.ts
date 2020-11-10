import { Home, User } from "./controllers/mod.ts";

const controllers = [ Home, User ];

export const getAllRoutes = () => {
	return controllers;
}

