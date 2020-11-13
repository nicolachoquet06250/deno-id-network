export class DependencyInjection {
	public static methodParameters: Record<string,
		Record<string,
			Record<number,
				{ object: Function, key: string }>>> = {};

	private static properties: Record<string, Record<string, any>> = {};

	private static className?: string;
	private static method?: string;

	static createClass(className: string) {
		this.className = className;
		if (!this.methodParameters[className]) {
			this.methodParameters[className] = {};
		}
		return this;
	}

	static createMethod(method: string) {
		this.method = method;
		if (this.className && !this.methodParameters[this.className][method]) {
			this.methodParameters[this.className][method] = {};
		}
		return this;
	}

	static createParameter(index: number, type: any) {
		if (this.className && this.method && !this.methodParameters[this.className][this.method][index]) {
			this.methodParameters[this.className][this.method][index] = type;
		}
	}

	static getParameters(className: string, method: string): Record<number, { object: Function, key: string }> {
		if (!this.methodParameters[className]) {
			return {};
		}
		return this.methodParameters[className][method];
	}

	static createProperty(className: string, property: string, type: any) {
		if (!this.properties[className]) {
			this.properties[className] = {};
		}
		if (!this.properties[className][property]) {
			this.properties[className][property] = type;
		}
	}

	static getProperties(className: string) {
		return this.properties[className];
	}

	static getProperty(className: string, key: string) {
		if (this.properties[className] && this.properties[className][key]) {
			return this.properties[className][key];
		}
	}

	static instantiateType(type: Function, ...params: any[]) {
		if ("create" in type) {
			// @ts-ignore
			return type.create(...params);
		}
		// @ts-ignore
		return new type(...params);
	}
}
