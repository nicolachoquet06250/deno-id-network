import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import { Context } from "../../lib/http/mod.ts";

@Controller()
export class Home {

	@InjectedProperty({ type: Context })
	private context?: Context;

	@Get()
	@Get('/home')
	@Get('/home/test')
	public async get() {
		if (this.context) {
			this.context.respond({
				page: 'home'
			});
		}
	}

	@Get('/ws/messages')
	public async ws() {
		if (this.context) {
			// @ts-ignore
			const { DOMAIN } = Deno.env.toObject();
			const url = (DOMAIN ? DOMAIN : this.context.request().url.origin)
				.replace('https://', 'wss://')
				.replace('http://', 'ws://');

			this.context.init_headers({ 'Content-Type': 'text/html' }).respond(`
				<!DOCTYPE html>
				<html lang="fr">
					<head>
						<meta charset="utf8" />
						<title>Test de Websockets</title>
					</head>
					<body>
						
						<script>
							let socket = null;
							try {
								// Connexion vers un serveur HTTPS
							    // prennant en charge le protocole WebSocket over SSL ("wss://").
							    socket = new WebSocket(window.location.protocol.replace('http', 'ws') + "//ws." + window.location.hostname);
							   
								// Récupération des erreurs.
								// Si la connexion ne s'établie pas,
								// l'erreur sera émise ici.
								socket.onerror = function(error) {
								    console.error(error);
								};
								
								// Lorsque la connexion est établie.
								socket.onopen = function(event) {
								    // Lorsque la connexion se termine.
								    this.onclose = function(event) {
								        console.log("Connexion terminé.");
								    };
								
								    // Lorsque le serveur envoi un message.
								    this.onmessage = function(event) {
								    	try {
								    		const json = JSON.parse(event.data);
									        console.log("Message:", json);
								    	} catch (e) {
								    		console.log("Message:", event.data);
								    	}
								    };
								
								    // Envoi d'un message vers le serveur.
								    this.send("Hello world!");
								};
							} catch (exception) {
							    console.error(exception);
							}
						</script>
					</body>
				</html>
			`);
		}
	}
}
