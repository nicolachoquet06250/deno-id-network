import { User } from "./api/models/User.ts";
import { Database } from "./lib/database/Database.ts";


async function create_and_get() {
	try {
		// @ts-ignore
		const user: User = await User.create('Nicolas', new Date());
		console.log(`${user}`);
	} catch (e) {
		console.error(e);
	}
}

async function get() {
	// @ts-ignore
	const user: User = await User.from({
		id: 2
	});
	console.log(user.id)
}

function juste_instantiate() {
	// @ts-ignore
	const user: User = new User(0, 'Nicolas', new Date());
	console.log(`${user}`);
}

async function migrate() {
	try {
		await Database.migrate();
		console.log('migration successful !')
	} catch (e) {
		console.error(e);
	}
}

async function update() {
	// @ts-ignore
	const user: User = await User.from({
		id: 2
	});

	user.name = 'Nicolas';

	// @ts-ignore
	if (await user.save()) {
		console.log(`${user}`, 'updated successful');
	}
}

async function remove() {
	// @ts-ignore
	const user: User = await User.from({ id: 2 });

	// @ts-ignore
	if (await user.remove()) {
		console.log(`user with id 2 has been removed`);
	}
}

async function getAll() {
	// @ts-ignore
	const users: Array<User> = await User.getAll();
	console.log(users);
}

// @ts-ignore
const args = Deno.args;

try {
	switch (args[0]) {
		case "create_and_get":
			await create_and_get();
			break;
		case "get":
			await get();
			break;
		case "juste_instantiate":
			juste_instantiate();
			break;
		case "migrate":
			await migrate();
			break;
		case "update":
			await update();
			break;
		case "remove":
			await remove();
			break;
		case "get_all":
			await getAll();
			break;
		default:
			throw new Error(`${args[0]} function is not implemented`);
	}
}
catch (e) {
	console.error(e);
}
