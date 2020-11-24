import "https://deno.land/x/dotenv/load.ts";

import { Client } from "https://deno.land/x/mysql/mod.ts";
import { FieldConfig, ModelConfig } from "../decorators/mod.ts";

export class Database {
	private static _connexion?: Promise<Client>;
	public static get connection(): Promise<Client> {
		// @ts-ignore
		const { DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_PORT } = Deno.env.toObject();
		const port = DB_PORT ? parseInt(DB_PORT) : 3306;

		if (!this._connexion) {
			this._connexion = new Client().connect({
				hostname: DB_HOSTNAME,
				username: DB_USERNAME,
				password: DB_PASSWORD,
				db: DB_DATABASE,
				port
			});
		}
		return this._connexion;
	}

	public static tables: Record<string, Record<string, any>> = {};
	public static tables_name: Record<string, ModelConfig> = {};

	public static models_states: Record<string, Record<string, any>> = {};

	private static get formatted_migration_data(): Record<string, Record<string, any>> {
		let tables: Record<string, Record<string, any>> = {};
		for (let table in this.tables) {
			if (this.tables_name[table]) {
				tables[this.tables_name[table].table] = {
					table: this.tables[table],
					infos: this.tables_name[table]
				};
			}
		}
		return tables;
	}

	public static async close() {
		if (this._connexion) {
			(await this._connexion).close();
			this._connexion = undefined;
		}
	}

	public static async migrate() {
		let tables: Record<string, Record<string, any>> = this.formatted_migration_data;
		for (let table in tables) {
			const table_infos = tables[table].infos;
			let request_str = `CREATE TABLE IF NOT EXISTS ${table} (\n`;

			const _table: Record<string, FieldConfig> = tables[table].table;
			// @ts-ignore
			for (let field of Object.values(_table)) {
				let type_size: number|undefined = 255;
				const type: string = field.type;
				switch (type) {
					case 'int':
						type_size = 11;
						break;
					case 'char':
					case 'varchar':
						type_size = 255;
						break;
					default:
						type_size = undefined;
				}
				request_str += `\t${field.name} ${field.type}${type_size ? `(${type_size})` : ''}${!field.nullable ? ' NOT NULL' : ''}${field.auto_increment ? ' AUTO_INCREMENT' : ''}${field.default ? ` DEFAULT ${field.default}` : ''},\n`;
			}

			let primary_keys: Array<string|undefined> = [];

			// @ts-ignore
			for (let field of Object.values(_table)) {
				if (field.key && field.key.primary) {
					primary_keys.push(field.name);
				}
			}

			if (primary_keys.length > 0) {
				request_str += `\tPRIMARY KEY (${primary_keys.join(",")})\n`;
			}

			request_str += `) ENGINE=${table_infos.engine}${table_infos.default ? ' DEFAULT' : ''} CHARSET=${table_infos.charset};`

			const client = await this.connection;
			await client.execute(request_str);
			await this.close();
		}
	}
}
