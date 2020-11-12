/*
import { ensureDir, ensureDirSync, v4, move, MultipartReader } from "./deps.ts";
import { SEP, join } from "https://deno.land/std/path/mod.ts";

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

const upload = function (
	path: string,
	options: UploadOptions = defaultUploadOptions
) {
	const mergedOptions = Object.assign({}, defaultUploadOptions, options);
	const { extensions, maxSizeBytes, maxFileSizeBytes, saveFile, readFile, useCurrentDir, useDateTimeSubDir } = mergedOptions;
	// @ts-ignore
	ensureDirSync(join(Deno.cwd(), 'temp_uploads'));
	return async (context: any, next: any) => {
		if (
			parseInt(context.request.headers.get("content-length")) > maxSizeBytes!
		) {
			context.throw(
				422,
				`Maximum total upload size exceeded, size: ${
					context.request.headers.get("content-length")
				} bytes, maximum: ${maxSizeBytes} bytes. `,
			);
			next();
		}
		const boundaryRegex = /^multipart\/form-data;\sboundary=(?<boundary>.*)$/;
		let match: RegExpMatchArray | null;
		if (
			context.request.headers.get("content-type") &&
			(match = context.request.headers.get("content-type")!.match(
				boundaryRegex,
			))
		) {
			// @ts-ignore
			const formBoundary: string = match.groups!.boundary;
			const mr = new MultipartReader(
				context.request.serverRequest.body,
				formBoundary,
			);
			const form = await mr.readForm(0);
			let res: any = {};
			let entries: any = Array.from(form.entries());
			let validations = "";
			for (const item of entries) {
				let values: any = [].concat(item[1]);
				for (const val of values) {
					if (val.filename !== undefined) {
						if (extensions!.length > 0) {
							let ext = val.filename.split(".").pop();
							// @ts-ignore
							if (!extensions!.includes(ext)) {
								validations +=
									`The file extension is not allowed (${ext} in ${val.filename}), allowed extensions: ${extensions}. `;
							}
						}
						if (val.size > maxFileSizeBytes!) {
							validations +=
								`Maximum file upload size exceeded, file: ${val.filename}, size: ${val.size} bytes, maximum: ${maxFileSizeBytes} bytes. `;
						}
					}
				}
			}
			if (validations != "") {
				await form.removeAll();
				context.throw(422, validations);
				next();
			}
			for (const item of entries) {
				let formField: any = item[0];
				let filesData: any = [].concat(item[1]);
				for (const fileData of filesData) {
					if (fileData.tempfile !== undefined) {
						let resData = fileData;
						if (readFile) {
							// @ts-ignore
							resData["data"] = await Deno.readFile(resData["tempfile"]);
						}
						if (saveFile) {
							let uploadPath = path;
							let uuid = '';
							if (useDateTimeSubDir) {
								const d = new Date();
								uuid = join(
									d.getFullYear().toString(),
									(d.getMonth()+1).toString(),
									d.getDate().toString(),
									d.getHours().toString(),
									d.getMinutes().toString(),
									d.getSeconds().toString(),
									v4.generate() //TODO improve to use of v5
								);
								uploadPath = join(path,uuid);
							};
							let fullPath = uploadPath;
							if (useCurrentDir) {
								// @ts-ignore
								fullPath = join(Deno.cwd(),fullPath);
							}
							await ensureDir(fullPath);
							await move(
								fileData.tempfile,
								join(fullPath,fileData.filename),
							);
							delete resData["tempfile"];
							resData["id"] = uuid.replace(/\\/g, "/");
							resData["url"] = encodeURI(
								join(uploadPath,fileData.filename).replace(/\\/g, "/"),
							);
							resData["uri"] = join(fullPath,fileData.filename);
						} else {
							let tempFileName = resData.tempfile.split(SEP).pop();
							// @ts-ignore
							let pathTempFile = join(Deno.cwd(),'temp_uploads',tempFileName)
							await move(
								resData.tempfile,
								pathTempFile,
							);
							resData.tempfile = pathTempFile;
						}
						if (res[formField] !== undefined) {
							if (Array.isArray(res[formField])) {
								res[formField].push(resData);
							} else {
								res[formField] = [res[formField], resData];
							}
						} else {
							res[formField] = resData;
						}
					}
				}
			}
			context["uploadedFiles"] = res;
		} else {
			context.throw(
				422,
				'Invalid upload data, request must contains a body with form "multipart/form-data", and inputs with type="file". ',
			);
		}
		next();
	};
};
const preUploadValidate = function (
	extensions: Array<string> = [],
	maxSizeBytes: number = Number.MAX_SAFE_INTEGER,
	maxFileSizeBytes: number = Number.MAX_SAFE_INTEGER,
) {
	return async (context: any, next: any) => {
		let jsonData = await context.request.body();
		jsonData = jsonData["value"];
		let totalBytes = 0;
		let validations = "";
		for (const iName in jsonData) {
			let files: any = [].concat(jsonData[iName]);
			for (const file of files) {
				totalBytes += jsonData[iName].size;
				if (file.size > maxFileSizeBytes) {
					validations +=
						`Maximum file upload size exceeded, file: ${file.name}, size: ${file.size} bytes, maximum: ${maxFileSizeBytes} bytes. `;
				}
				// @ts-ignore
				if (!extensions.includes(file.name.split(".").pop())) {
					validations += `The file extension is not allowed (${
						file.name.split(".").pop()
					} in ${file.name}), allowed extensions: ${extensions}. `;
				}
			}
		}
		if (totalBytes > maxSizeBytes) {
			validations +=
				`Maximum total upload size exceeded, size: ${totalBytes} bytes, maximum: ${maxSizeBytes} bytes. `;
		}
		if (validations != "") {
			context.throw(422, validations);
		}
		next();
	};
};
export { upload, preUploadValidate };
*/

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
