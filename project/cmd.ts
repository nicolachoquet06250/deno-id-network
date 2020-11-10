import { Database } from "./lib/database/Database.ts";

function Make(func: string, ...args: string[]) {
	// @ts-ignore
	if (func in this) {
		// @ts-ignore
		this[func](...args);
		return;
	}
	throw Error(`make.${func} not found`);
}

Make.prototype.env = function (...args: string[]) {
	let file_content = '';

	for (let line of args) {
		file_content += `${line}\n`;
	}

	// @ts-ignore
	Deno.writeTextFileSync('.env', file_content);
}

Make.prototype.migrate = async function (...args: string[]) {
	try {
		await Database.migrate();
		console.log('migration successful !')
	} catch (e) {
		console.error(e);
	}
}

try {
	// @ts-ignore
	let args = [...Deno.args];
	const func = args.shift();
	// @ts-ignore
	new Make(func, ...args);
} catch (e) {
	console.error(`ERROR : ${e.message}`);
}
