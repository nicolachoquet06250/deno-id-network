import { move, ensureDir, exists } from "https://deno.land/std@0.61.0/fs/mod.ts";

interface UploadOptions {
	extensions?: Array<string>;
	maxSizeBytes?: number;
	maxFileSizeBytes?: number;
	saveFile?: boolean;
	readFile?: boolean;
	useCurrentDir?: boolean;
	useDateTimeSubDir?: boolean;
}

const defaultUploadOptions: UploadOptions = {
	extensions: [],
	maxSizeBytes: Number.MAX_SAFE_INTEGER,
	maxFileSizeBytes: Number.MAX_SAFE_INTEGER,
	saveFile: true,
	readFile: false,
	useCurrentDir: true,
	useDateTimeSubDir: true,
}

export const upload = (path: string, options: UploadOptions = defaultUploadOptions) =>
	async (context: any, next: Function) => {
		const mergedOptions = Object.assign({}, defaultUploadOptions, options);
		const { extensions, maxSizeBytes, maxFileSizeBytes, saveFile, readFile, useCurrentDir, useDateTimeSubDir } = mergedOptions;

		const formData = await context.request.body().value.read();

		if (formData.files) {
			// @ts-ignore
			if (!(await exists(`${Deno.cwd()}/${path}`))) {
				// @ts-ignore
				await ensureDir(`${Deno.cwd()}/${path}`);
			}

			for (let file of formData.files) {
				// @ts-ignore
				await move(file.filename, `${Deno.cwd()}/${path}/${file.originalName}`);
			}
		}

		next();
	};
