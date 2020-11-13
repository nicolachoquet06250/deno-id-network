import { Database } from "../database/Database.ts";
import { recursiveReaddir } from "https://deno.land/x/recursive_readdir/mod.ts";
import { exists, ensureDir, readFileStr, readFileStrSync } from "https://deno.land/std@0.61.0/fs/mod.ts";

export class CustomObject extends Object {
	static values(object: any): any[] {
		let result: any[] = [];
		for (let key of this.keys(object)) {
			result.push(object[key]);
		}
		return result;
	}

	static equals(object1: Record<string, any>, object2: Record<string, any>): boolean {
		if (Object.keys(object1).length !== Object.keys(object2).length) {
			return false;
		}

		for (let key of this.keys(object1)) {
			if (key in object2) {
				if (typeof object2[key] === "object" && typeof object1[key] === "object") {
					return this.equals(object1[key], object2[key]);
				} else if (typeof object2[key] !== "object" && typeof object1[key] !== "object" && object1[key] !== object2[key]) {
					return false;
				} else if (typeof object2[key] === "object" && typeof object1[key] !== "object" || typeof object2[key] !== "object" && typeof object1[key] === "object") {
					return false;
				} else if (key == "0") {
					return false;
				}/* else {
					console.log(1, key)
				}*/
			} else {
				return false;
			}
		}

		for (let key of this.keys(object2)) {
			if (key in object1) {
				if (typeof object2[key] === "object" && typeof object1[key] === "object") {
					return this.equals(object1[key], object2[key]);
				} else if (typeof object2[key] !== "object" && typeof object1[key] !== "object" && object1[key] !== object2[key]) {
					return false;
				} else if (typeof object2[key] === "object" && typeof object1[key] !== "object" || typeof object2[key] !== "object" && typeof object1[key] === "object") {
					return false;
				} else if (key == "0") {
					return false;
				} /*else {
					console.log(2, key)
				}*/
			} else {
				return false;
			}
		}

		return true;
	}

	static diffs(object1: Record<string, any>, object2: Record<string, any>, diffs: Record<string, any> = {}): Record<string, any> {
		for (let key of Object.keys(object1)) {
			if (Object.keys(object2).indexOf(key) === -1) {
				diffs[key] = {
					deleted: true
				};
			}
		}

		for (let key of Object.keys(object2)) {
			if (Object.keys(object1).indexOf(key) === -1) {
				diffs[key] = {
					added: true,
					elem: object2[key]
				};
			}
		}

		return diffs;
	}
}

export type ModelConfig = {
	table: string;
	engine?: string;
	default?: boolean;
	charset?: string;
};

export type FieldConfig = {
	name?: string,
	type: string,
	size?: number,
	auto_increment?: boolean,
	nullable?: boolean,
	default?: any,
	key?: Record<string, boolean>
};

export type WatchConfig = {
	on_changed?: Function,
	on_initialized?: Function
};

type InsertResult = {
	affectedRows: number,
	lastInsertId: number
};

interface IModelBase {}

export interface IModel {
	save(): Promise<IModelBase|void>;
	remove(): Promise<boolean|void>;
	toString(): string;
}

type DynamicMethod = Function|undefined;

export async function get_migrations() {
	// @ts-ignore
	return await recursiveReaddir(Deno.cwd() + '/project/migrations');
}

export function Model(conf: ModelConfig) {
	if (!conf.engine) conf.engine = 'InnoDB';
	if (!conf.default) conf.default = true;
	if (!conf.charset) conf.charset = 'utf8';

	return function <T extends { new (...args: any[]): {} }>(constructor: T) {
		Database.tables_name[constructor.name] = conf;

		let parameters: Array<string> = CustomObject.values(Database.tables[constructor.name])
			.map(field => field.name);
		parameters.shift();

		return class Model extends constructor implements IModel, IModelBase {
			public id?: number;

			/**
			 * @param {Array<any>} params
			 */
			constructor(...params: Array<any>) {
				super();
				let i = 0;
				for (let prop of CustomObject.values(Database.tables[constructor.name]).map(v => v.name)) {
					// @ts-ignore
					this[prop] = params[i];
					i++;
				}
			}

			/**
			 * @param {Array<any>} params
			 */
			public static async create(...params: Array<any>): Promise<IModelBase> {
				const client = await Database.connection;

				let values = parameters.map((p, i) => {
					let param_value;
					eval(`param_value = params[i]`)
					return param_value;
				});

				const result = await client.execute(`INSERT INTO \`${Database.tables_name[constructor.name].table}\` (\`${parameters.join('\`, \`')}\`) VALUES(${(() =>
					values.map(_ => '?'))().join(', ')})`, values);

				await Database.close();

				const obj = await this.from({ id: result.lastInsertId });

				return obj instanceof Array ? obj[0] : obj;
			}

			public async save(): Promise<IModelBase|void> {
				if (Object.keys(Database.models_states[constructor.name].changes).length > 0) {
					const client = await Database.connection;

					const result = await client.execute(`UPDATE \`${Database.tables_name[constructor.name].table}\` SET ${(() => {
						let tmp = [];
						for (let prop of Object.keys(Database.models_states[constructor.name].changes)) {
							tmp.push(prop + ' = ' +
								(Database.tables[constructor.name][prop].type !== 'int' ? '"' : '') +
								Database.models_states[constructor.name].changes[prop] +
								(Database.tables[constructor.name][prop].type !== 'int' ? '"' : '')
							)
						}
						return tmp;
					})().join(', ')} WHERE id = ${this.id}`);

					await Database.close();

					if (result.affectedRows && result.affectedRows > 0) {
						Database.models_states[constructor.name].changes = {};
						return this;
					}
					throw Error('sql update query error');
				}
				return this;
			}

			public static async from(config: Record<string, any>): Promise<Array<Model>|Model|boolean> {
				const client = await Database.connection;

				let result;
				let sql = `SELECT * FROM \`${Database.tables_name[constructor.name].table}\` WHERE`;
				if (config.id) {
					result = await client.query(sql + ' id=' + config.id);

					await Database.close();

					if (result.length > 0) {
						return new Model(...CustomObject.values(result[0]));
					}
					return false;
				} else {
					let conditions = [];
					for (let field of Object.keys(config)) {
						conditions.push(field + '=' +
							// @ts-ignore
							(typeof config[field] === "int" ? '' : '"') +
							config[field] +
							// @ts-ignore
							(typeof config[field] === "int" ? '' : '"')
						)
					}
					result = await client.query(sql + " " + conditions.join(' AND '));
				}

				await Database.close();

				let results: Array<Model> = [];
				for (let elem of result) {
					results.push(new Model(...CustomObject.values(elem)));
				}
				return results;
			}

			public async remove(): Promise<boolean|void> {
				const client = await Database.connection;

				const result = await client.execute(`DELETE from \`${Database.tables_name[constructor.name].table}\` WHERE id=${this.id}`)

				await Database.close();

				if (result.affectedRows && result.affectedRows > 0) {
					return true;
				}
				throw new Error(`${Database.tables_name[constructor.name].table} with id ${this.id} doesn't exists`);
			}

			public static async getAll(): Promise<Array<Model>> {
				const client = await Database.connection;

				const result = await client.query('SELECT * FROM `' + Database.tables_name[constructor.name].table + '`');

				await Database.close();

				return result.map((r: Record<string, any>) => {
					return new Model(...CustomObject.values(r));
				});
			}

			toString(): string {
				return `${constructor.name} { ${(() => {
					return CustomObject.values(Database.tables[constructor.name])
						.map(v => v.name)
						// @ts-ignore
						.map(p => `_${p}: ${(CustomObject.values(Database.tables[constructor.name][p].type !== 'int' ? '"' : ''))}${this[p]}${(CustomObject.values(Database.tables[constructor.name][p].type !== 'int' ? '"' : ''))}`)
						.join(', ')
				})()} }`;
			}

			toJson(): Record<string, any> {
				let model: Record<string, any> = {};
				for (let key of CustomObject.keys(Database.tables[constructor.name])) {
					// @ts-ignore
					model[key] = this[key];
				}
				return model;
			}

			public static async create_migration() {
				const get_next_file = async (current_file: string): Promise<string> => {
					// @ts-ignore
					const slash = Deno.build.os === 'windows' ? '\\' : '/';

					const date = new Date();

					const file_name = current_file.split('.')[0];
					const ext = current_file.split('.')[1];

					if (date_to_filename(date) !== file_name.split(slash)[file_name.split(slash).length - 1]) {
						let _file_name = file_name.split(slash);
						_file_name.pop();
						let __file_name = _file_name.join(slash);
						return get_next_file(__file_name + slash + date_to_filename(date) + '.' + ext);
					}

					if (file_name.split('_').length === 1) {
						return await exists(current_file) ? file_name + '_1.' + ext : current_file;
					} else {
						const increment = parseInt(file_name.split('_')[1]) + 1;

						return await exists(file_name.split('_')[0] + '_' + increment + '.' + ext) ?
							get_next_file(file_name.split('_')[0] + '_' + increment + '.' + ext)
							: file_name.split('_')[0] + '_' + increment + '.' + ext;
					}
				};

				const date_to_filename = (date: Date) =>
					date.toString().split(' (')[0]
						.replace(/\ /g, '-')
						.replace(/\+/g, '-')
						.replace(/\:/g, '-');

				const table = {
					migrated: false,
					table: Database.tables[constructor.name],
					infos: Database.tables_name[constructor.name]
				};

				// @ts-ignore
				const root = Deno.cwd();

				if (!await exists(root + '/project/migrations')) {
					ensureDir(root + '/project/migrations');
				}

				const migrations = await get_migrations();

				if (migrations.length > 0) {
					for (let migration_file of migrations) {
						const migration = JSON.parse(await readFileStr(migration_file));

						if (!migration.data.migrated && migration.data.infos.table === table.infos.table) {
							if (!CustomObject.equals(migration.data.table, table.table)) {
								const diff = CustomObject.diffs(migration.data.table, table.table);

								const next_file = await get_next_file(migration_file);

								// @ts-ignore
								await Deno.writeTextFile(
									next_file,
									JSON.stringify({
										type: 'update',
										data: {
											migrated: false,
											table: diff,
											infos: table.infos
										}
									})
								);
							}
						}
					}
				} else {
					const file = root + '/project/migrations/' + date_to_filename(new Date()) + '.json';

					const next_file = await get_next_file(file);

					// @ts-ignore
					await Deno.writeTextFile(
						next_file,
						JSON.stringify({
							type: 'create',
							data: table
						})
					);
				}
			}

			public static async get_last_migrations() {
				// @ts-ignore
				const migrations = (await get_migrations()).reverse();
				let tmp = [];
				for (let m of migrations) {
					let j;
					if ((j = JSON.parse(await readFileStr(m)))) {
						if (!j.data.migrated) {
							tmp.push(m);
						}
					}
				}

				return tmp;
			}

			public static async migrate() {
				const table = {
					migrated: false,
					table: Database.tables[constructor.name],
					infos: Database.tables_name[constructor.name]
				};

				if ((await this.get_last_migrations()).length === 0) {

					const table_infos = table.infos;
					let request_str = `CREATE TABLE IF NOT EXISTS ${table.infos.table} (\n`;

					const _table: Record<string, FieldConfig> = table.table;

					for (let field of CustomObject.values(_table)) {
						let type_size: number | undefined = 255;
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

					let primary_keys: Array<string | undefined> = [];

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

					const client = await Database.connection;
					await client.execute(request_str);
					await Database.close();
				} else {

				}
			}
		}
	}
}

export const Field = (conf: FieldConfig) =>
	(target: {} | any, name: PropertyKey) => {
		const table_name = target.constructor.name;

		if (!Database.tables[table_name]) {
			Database.tables[table_name] = {};
		}

		if (!Database.tables[table_name][name.toString()]) {
			Database.tables[table_name][name.toString()] = {};
		}

		if (!conf.name) {
			conf.name = name.toString();
		}

		Database.tables[table_name][name.toString()] = { ...Database.tables[table_name][name.toString()], ...conf };

		Object.defineProperty(target.constructor.prototype, name.toString(), {
			set(value: any) {
				const target_name = target.constructor.name;

				name = name.toString();

				if (!this[`_${name}`]) {
					if (!Database.models_states[target_name]) {
						Database.models_states[target_name] = { initialized: {}, changes: {} };
					}

					Database.models_states[target_name].initialized[name] = value;
				}

				if (this[`_${name}`] && this[`_${name}`] !== value) {
					Database.models_states[target_name].initialized[name] = value;
					Database.models_states[target_name].changes[name] = value;
				}

				this[`_${name}`] = value;
			},
			get() {
				name = name.toString()/*.substr(1, name.toString().length - 1)*/;
				return this[`_${name}`];
			}
		})
	};

export const Key = (conf: Record<string, string|boolean|any> = {}) =>
	(target: {} | any, name: PropertyKey) => {
		const table_name = target.constructor.name;

		if (!Database.tables[table_name]) {
			Database.tables[table_name] = {};
		}

		if (!Database.tables[table_name][name.toString()]) {
			Database.tables[table_name][name.toString()] = {};
		}

		Database.tables[table_name][name.toString()] = { ...Database.tables[table_name][name.toString()], key: conf };
	};

export const Watch = (conf: WatchConfig = {}) =>
	(target: {} | any, name: PropertyKey) => {
		Object.defineProperty(target.constructor.prototype, '_' + name.toString(), {
			set(value: any) {
				if (!this[`__${name.toString()}`] && conf.on_initialized) {
					const on_initialized: Function = conf.on_initialized.bind(this)
					on_initialized(value, this);
				}

				if (this[`__${name.toString()}`] && this[`__${name.toString()}`] !== value && conf.on_changed) {
					const on_changed: Function = conf.on_changed.bind(this)
					on_changed(value, this[`__${name.toString()}`], this);
				}

				this['__' + name.toString()] = value;
			},
			get() {
				return this[`__${name.toString()}`];
			}
		})
	};
