import { Home, User, Image } from "./controllers/mod.ts";
import { Messages } from "./websockets/Messages.ts";

export const getAllRoutes = () =>
	[ Home, User, Image, Messages ];

