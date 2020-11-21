import "https://deno.land/x/dotenv/load.ts";

import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

/**
 * @param to Email address of the destination
 * @param subject
 * @param content
 */
export async function sendMail(to: string, subject: string, content: string) {
	const client = new SmtpClient();

	const {
		SMTP_TLS,
		SMTP_HOSTNAME,
		SMTP_PORT,
		SMTP_USERNAME,
		SMTP_PASSWORD
		// @ts-ignore
	} = Deno.env.toObject();

	if (SMTP_HOSTNAME) {
		if (Boolean(parseInt(SMTP_TLS))) {
			await client.connectTLS({
				hostname: SMTP_HOSTNAME,
				port: parseInt(SMTP_PORT),
				username: SMTP_USERNAME,
				password: SMTP_PASSWORD,
			});
		}
		else {
			await client.connect({
				hostname: SMTP_HOSTNAME,
				port: parseInt(SMTP_PORT),
				username: SMTP_USERNAME,
				password: SMTP_PASSWORD,
			});
		}

		await client.send({ from: SMTP_USERNAME, to, subject, content });

		await client.close();
	} else {
		throw new Error(`Veuillez renseigner les informations de connexion à votre serveur SMTP en variable d'environement`);
	}
}


/*******************************************************/
/* ******************* EXAMPLES ********************** */
/*******************************************************/
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
