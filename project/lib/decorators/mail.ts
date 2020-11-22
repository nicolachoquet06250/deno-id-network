import { MailContent, Mailer, MailSubject } from "../mail/mod.ts";

export const Mail = (config: { subject: MailSubject, template: MailContent }) => (target: {} | any) => {
	Mailer.mails.set(target.name, {
		subject: config.subject,
		template: config.template
	});
};
