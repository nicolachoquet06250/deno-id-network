import { Field, Key, Model, Watch } from "../../lib/decorators/db.ts";

@Model({ table: 'user' })
export class User {
	@Key({ primary: true })
	@Field({
		name: 'id',
		type: 'int',
		auto_increment: true,
		nullable: false
	})
	public id?: number;

	@Field({
		nullable: false,
		type: 'varchar'
	})
	@Watch({
		on_initialized(value: string) {
			console.log('name', 'initialized at', value);
		},
		on_changed(value: string, old: string, that: User) {
			console.log('current object', that);
			console.log('name', old, 'changed with', value);
		}
	})
	public name?: string;

	@Field({
		nullable: false,
		type: 'timestamp',
		default: 'current_timestamp'
	})
	public created_at?: Date;
}
