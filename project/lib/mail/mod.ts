import "https://deno.land/x/dotenv/load.ts";

import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

/**
 * @param to Email address of the destination
 * @param subject
 * @param content
 */
export async function sendMail(to: string, subject: string, content: string) {
	const {
		SMTP_TLS,
		SMTP_HOSTNAME, SMTP_PORT,
		SMTP_USERNAME, SMTP_PASSWORD
		// @ts-ignore
	} = Deno.env.toObject();

	if (SMTP_HOSTNAME) {
		const client = new SmtpClient();

		const connectConf = {
			hostname: SMTP_HOSTNAME,
			port: parseInt(SMTP_PORT),
			username: SMTP_USERNAME,
			password: SMTP_PASSWORD,
		};

		Boolean(parseInt(SMTP_TLS))
			? await client.connectTLS(connectConf) : await client.connect(connectConf);

		await client.send({ from: SMTP_USERNAME, to, subject, content });

		await client.close();
	} else {
		throw new Error(`Veuillez renseigner les informations de connexion à votre serveur SMTP en variable d'environement`);
	}
}


/************************************************************/
/* ************* EXAMPLES D'UTILISATION ******************* */
/************************************************************/
/* try {
	await sendMail(
    	"nchoquet@norsys.fr",
		"Test d'envoie de mail avec DENO",
		"Mail Content，maybe <b>HTML</b>"
	);
	console.log('Votre mail à été envoyé avec succès');
} catch (err) {
	console.error(err.message);
} */

export type Email = string;
export type MailContent = string|Function;
export type MailSubject = string|Function;
export type Mail = {
	subject: MailSubject,
	template: MailContent
};
export type MailList = Map<string, Mail>;

export abstract class MailTemplate {
	public receiver?: Email;
	public template?: MailContent;
	public subject?: MailSubject;

	public async send() {
		const subject = typeof this.subject === "function" ? this.subject(this) : this.subject;
		this.subject = subject;
		const template = typeof this.template === "function" ? this.template(this) : this.template;

		if (this.receiver && this.subject) {
			await sendMail(this.receiver, subject, template);
		} else {
			throw new Error('receiver and subject are required');
		}
	}
}

export class Mailer {
	public static mails: MailList = new Map<string, Mail>();

	async create<T extends MailTemplate>(type: (new () => T)): Promise<T | undefined> {
		const mail = new type();
		let mailConfig;
		if ((mailConfig = Mailer.mails.get(mail.constructor.name))) {
			mail.template = mailConfig.template;
			mail.subject = mailConfig.subject;
			return mail;
		} else {
			throw new Error('this class is not allowed');
		}
	}
}

/************************************************************/
/* ************* EXAMPLES D'UTILISATION ******************* */
/************************************************************/

/************************************************************/
/* ************** CAS D'UTILISATION 1 ********************* */
/************************************************************/

// try {
// 	const mail = new MailTest();
// 	mail.receiver = 'nicolachoquet06250@gmail.com';
//
// 	const mails = [mail, mail];
// 	await new Mailer(mails).send();
// 	console.log(`Les mails ont respectivement été envoyés avec succès à ${mails.map(m => m.receiver).join(' and ')}`)
// } catch (err) {
// 	console.error(err.message);
// }

/************************************************************/
/* ************** CAS D'UTILISATION 2 ********************* */
/************************************************************/

// const mailer = new Mailer();
// Promise.all([
// 	mailer.create(MailTest),
// 	mailer.create(MailTest)
// ]).then((mails: Array<MailTest|undefined>) =>
// 	mails.map(m => {
// 		if (m) m.receiver = 'nicolachoquet06250@gmail.com';
// 		return m;
// 	})
// ).then((mails: Array<MailTest|undefined>) =>
// 	mails.map(m => m ? m.send() : m)
// ).then(() => {
// 	console.log('tous les mails ont été envoyés')
// }).catch(err => {
// 	console.error(err);
// });
