import { EventType, MessageType, WebSocketClient } from "./websocket/lib/WebSocketClient.ts";

enum ALERT_TYPE {
	ERROR = 'error',
	WARNING = 'warn',
	SUCCESS = 'success'
}

/**
 * @param {string} message message de l'alerte
 * @param {ALERT_TYPE} type type d'alerte
 * @param {number} time temps d'affichage de l'alerte en ms
 */
function show_alert(message?: string, type?: ALERT_TYPE, time: number = 4000) {
	hide_alert();
	const alert = document.querySelector('.alert');
	if (alert) {
		if (message) alert.innerHTML = message;
		if (type) {
			for (let k of Object.keys(ALERT_TYPE)) {
				// @ts-ignore
				const v = ALERT_TYPE[k];
				if (v !== type) {
					alert.classList.remove(v);
				}
			}
			alert.classList.add(type);
		}
		alert.classList.remove('hide');
	}
	setTimeout(hide_alert, time);
}
function hide_alert() {
	const alert = document.querySelector('.alert');
	if (alert) alert.classList.add('hide');
}

let custom_closed = false;

enum CHANNELS {
	NEW_CONNEXION = 'new_connexion',
	DISCONNECT = 'disconnect',
	ALREADY_CONNECTED = 'already_connected'
}

enum INTERLOCUTOR_STATES {
	ONLINE = 'Active Now',
	OFFLINE = 'Inactive Now'
}

const login_form = document.querySelector('.login-form');
if (login_form) {
	login_form.addEventListener('submit', (e: any) => {
		e.preventDefault();

		const myName = document.querySelector('#name');
		if (myName) {
			const ws = new WebSocketClient(
				window.location.hostname,
				undefined,
				(window.location.protocol === 'https:'),
				'/messages'
			);
			ws.on(EventType.ERROR, (e: any) => {
				show_alert(e.error.message, ALERT_TYPE.ERROR);

				console.error('error', e.error);
			})
			ws.on(EventType.CLOSE, (e: any) => {
				show_alert('Vous avez été déconnecté', ALERT_TYPE.WARNING);

				if (custom_closed) {
					const button = document.querySelector('.login-form input[type="submit"]');
					if (button) {
						button.removeAttribute('disabled');
					}
					custom_closed = false;
				}

				console.warn('close', e.event);
			})
			ws.on(EventType.OPEN, (e: any) => {
				console.log('open', e.event);

				// @ts-ignore
				ws.send_channel('new_connexion', { user: { name: myName.value } });
			});

			ws.on_channel(CHANNELS.NEW_CONNEXION, (json: Record<string, any>) => {
				if ('user' in json) {
					show_alert(`L'utilisateur ${json.user.name} viens de se connecter`, ALERT_TYPE.SUCCESS);
					const user_name_html_element = document.querySelector('#interlocutor-name');
					const user_state_html_element = document.querySelector('#interlocutor-state');
					if (user_name_html_element) {
						user_name_html_element.innerHTML = json.user.name;
					}
					if (user_state_html_element) {
						user_state_html_element.innerHTML = INTERLOCUTOR_STATES.ONLINE;
					}
					const myName = document.querySelector('#name');
					if (myName) {
						ws.send_channel(CHANNELS.ALREADY_CONNECTED, {
							user: {
								// @ts-ignore
								name: myName.value
							}
						})
					}
				}
				else if ('error' in json && json.error) {
					show_alert(json.message, ALERT_TYPE.ERROR);
					const button = document.querySelector('.login-form input[type="submit"]');
					if (button) {
						button.setAttribute('disabled', 'disabled');
					}
					custom_closed = true;
					ws.close();
				}
				else {
					show_alert(`Vous êtes connecté`, ALERT_TYPE.SUCCESS);
					const modal = document.querySelector('.login-overlay');
					if (modal) {
						modal.classList.add('hide');
					}
				}
			});

			ws.on_channel(CHANNELS.DISCONNECT, () => {
				const user_state_html_element = document.querySelector('#interlocutor-state');
				if (user_state_html_element) {
					user_state_html_element.innerHTML = INTERLOCUTOR_STATES.OFFLINE;
				}
				show_alert(`Un utilisateur s'est déconnecté`, ALERT_TYPE.WARNING);
			});

			ws.on_channel(CHANNELS.ALREADY_CONNECTED, (json: { user: { name: string } }) => {
				const user_name_html_element = document.querySelector('#interlocutor-name');
				const user_state_html_element = document.querySelector('#interlocutor-state');
				if (user_name_html_element) {
					user_name_html_element.innerHTML = json.user.name;
				}
				if (user_state_html_element) {
					user_state_html_element.innerHTML = INTERLOCUTOR_STATES.ONLINE;
				}
			})

			// ws.on(EventType.MESSAGE, (e: any) => {
			// 	const { message: json } = e;
			//
			// 	console.log(json, 'json');
			// }, MessageType.JSON)

			// ws.on(EventType.MESSAGE, (e: any) => {
			// 	console.log(e.message, 'text');
			// }, MessageType.TEXT)

			ws.listen();
		}
	});
}
