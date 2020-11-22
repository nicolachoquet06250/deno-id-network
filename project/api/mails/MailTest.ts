import { MailTemplate} from "../../lib/mail/mod.ts";
import { Mail } from "../../lib/decorators/mail.ts";

@Mail({
	subject: (that: MailTest) => `Mon email pour ${that.receiver}`,
	template: function (that: MailTest) {
		const subject = typeof this.subject === "function" ? this.subject(that) : this.subject;
		return `<!DOCTYPE html>
<html lang="fr">
	<header>
		<meta charset="utf8" />
		<title>${subject}</title>
	</header>
	<body>
		<h1>${subject}</h1>
		<p>${that.receiver}</p>
	</body>
</html>`
	}
})
export class MailTest extends MailTemplate {}
