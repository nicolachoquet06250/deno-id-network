import { Database } from "../database/Database.ts";

export class CustomObject extends Object {
	static values(object: any): any[] {
		let result: any[] = [];
		for (let key of this.keys(object)) {
			result.push(object[key]);
		}
		return result;
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
	save(): Promise<boolean|void>;
	remove(): Promise<boolean|void>;
	toString(): string;
}

type DynamicMethod = Function|undefined;

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

			public async save(): Promise<boolean|void> {
				if (Database.models_states[constructor.name].changes.length > 0) {
					const client = await Database.connection;

					const result = await client.execute(`UPDATE \\\`${Database.tables_name[constructor.name].table}\\\` SET ${(() => {
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
						return true;
					}
					throw Error('sql update query error');
				}
				return true;
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
		Object.defineProperty(target.constructor.prototype, name.toString(), {
			set(value: any) {
				const target_name = target.constructor.name;

				if (!this[`_${name.toString()}`] && conf.on_initialized) {
					const on_initialized: Function = conf.on_initialized.bind(this)
					on_initialized(value, this);

					if (!Database.models_states[target_name]) {
						Database.models_states[target_name] = { initialized: {}, changes: {} };
					}

					Database.models_states[target_name].initialized[name.toString()] = value;
				}

				if (this[`_${name.toString()}`] && this[`_${name.toString()}`] !== value && conf.on_changed) {
					const on_changed: Function = conf.on_changed.bind(this)
					on_changed(value, this[`_${name.toString()}`], this);

					Database.models_states[target_name].initialized[name.toString()] = value;
					Database.models_states[target_name].changes[name.toString()] = value;
				}

				this[`_${name.toString()}`] = value;
			},
			get() {
				return this[`_${name.toString()}`];
			}
		})
	};
