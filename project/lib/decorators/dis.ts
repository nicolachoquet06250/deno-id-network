import { DependencyInjection } from "../dis/DependencyInjection.ts";
import { CustomObject, getParams } from "./mod.ts";

export function ConstructorInjection() {
	return function (target: {} | any) {
		target.create = function () {
			const params = CustomObject.values(DependencyInjection.getParameters(target.name, 'constructor'))
				.map((p: { key: string, object: Function }) => p.object)
				.map((p: Function) => DependencyInjection.instantiateType(p));

			return new target(...params);
		};

		return target;
	}
}

export function InjectedProperty(conf: { type: any }) {
	return function (target: {} | any, key: string) {
		Object.defineProperty(target, key, {
			get() {
				if (!this[`_${key}`]) {
					this[`_${key}`] = new (conf.type)();
				}
				return this[`_${key}`];
			}
		});
	}
}

export function InjectedParameter(conf: { type: any }) {
	return function (target: {} | any, key: string, index: number) {
		const params = getParams(target);

		DependencyInjection.createClass(target.name)
			.createMethod('constructor')
			.createParameter(index, {
				key: params[index],
				object: conf.type
			});
	}
}
