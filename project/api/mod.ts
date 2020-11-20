import { Home, User, Image } from "./controllers/mod.ts";
import { Messages } from "./websockets/Messages.ts";
import { TypeScript } from "./controllers/TypeScript.ts";

export const getAllRoutes = () =>
	[ Home, User, Image, TypeScript, Messages ];

