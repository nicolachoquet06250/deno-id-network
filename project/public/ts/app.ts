import { EventType, WebSocketClient } from "./websocket/lib/WebSocketClient.ts";

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
	ALREADY_CONNECTED = 'already_connected',
	MESSAGE = 'message',
	IS_WRITTEN = 'is_written'
}

enum INTERLOCUTOR_STATES {
	ONLINE = 'Active Now',
	OFFLINE = 'Inactive Now'
}

const createMessage = (message: string, date: Date, is_me: boolean) => `
	<div class="talk ${is_me ? 'right' : 'left'}">
		${is_me ? `<p>${message.replace(/\n/g, '<br />')}</p>` : `<img src="/img/public/assets/images/avatar2.jpg" alt="" />`}
		${is_me ? `<img src="/img/public/assets/images/avatar1.jpg" alt="" />` : `<p>${message.replace(/\n/g, '<br />')}</p>`}
	</div>
`;
const createNoMessage = (user?: { id: number, name: string, date: Date }) => `
	<div class="no-message-header">
		<div>
			<img src="${user ? '/img/public/assets/images/avatar2.jpg' : '/img/public/assets/images/unknown_user.png'}" alt="" />
		</div>
		<div>
			<p>${user ? user.name : 'Unknown User'}</p>
			<p>Inactive Now</p>
		</div>
	</div>
	<p> Aucun message dans la conversation </p>
`;
const isWritten = () => `
	<div class="talk left talk-loader">
		<img src="/img/public/assets/images/avatar2.jpg" alt="" />
		<div class="loader-container">
			<div class="loader">
				<div class="bubble bubble-1"></div>
				<div class="bubble bubble-2"></div>
				<div class="bubble bubble-3"></div>
			</div>
		</div>
	</div>
`;

const no_messages = document.querySelector('.no-message');
if (no_messages) {
	const storage = localStorage.getItem('interlocutor');
	if (storage) {
		const user = JSON.parse(storage).user;
		no_messages.innerHTML = createNoMessage(user)
	} else {
		no_messages.innerHTML = createNoMessage()
	}
}
const user = document.querySelector('.user');
if(user) {
	const storage = localStorage.getItem('interlocutor');
	if (storage) {
		const _user = JSON.parse(storage).user;
		const interlocutorName = user.querySelector('#interlocutor-name')
		if (interlocutorName) {
			interlocutorName.innerHTML = _user.name;
		}
	}
}

const login_form = document.querySelector('.login-form');
if (login_form) {
	login_form.addEventListener('submit', (e: any) => {
		e.preventDefault();

		const myName: HTMLInputElement|null = document.querySelector('#name');
		if (myName) {
			const ws = new WebSocketClient(
				window.location.hostname, undefined,
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
				ws.send_channel('new_connexion', { user: { name: myName.value } });
			});

			ws.on_channel(CHANNELS.NEW_CONNEXION, (json: { user?: any, socket_id?: number, error?: boolean, message?: string }) => {
				if ('user' in json) {
					localStorage.setItem('interlocutor', JSON.stringify(json))

					show_alert(`L'utilisateur ${json.user.name} viens de se connecter`, ALERT_TYPE.SUCCESS);
					const user_name_html_element = document.querySelector('#interlocutor-name');
					const user_state_html_element = document.querySelector('#interlocutor-state');
					const user_state_html_no_message_element = document.querySelector('.no-message .no-message-header div:nth-child(2) p:nth-child(2)');
					if (user_name_html_element) {
						user_name_html_element.innerHTML = json.user.name;
					}
					if (user_state_html_element) {
						user_state_html_element.innerHTML = INTERLOCUTOR_STATES.ONLINE;
					}
					if (user_state_html_no_message_element) {
						user_state_html_no_message_element.innerHTML = INTERLOCUTOR_STATES.ONLINE;
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

			ws.on_channel(CHANNELS.DISCONNECT, (json: { socket_id: number }) => {
				const user_state_html_element = document.querySelector('#interlocutor-state');
				const user_state_html_no_message_element = document.querySelector('.no-message .no-message-header div:nth-child(2) p:nth-child(2)');
				if (user_state_html_element) {
					user_state_html_element.innerHTML = INTERLOCUTOR_STATES.OFFLINE;
				}
				if (user_state_html_no_message_element) {
					user_state_html_no_message_element.innerHTML = INTERLOCUTOR_STATES.OFFLINE;
				}

				const interloc = localStorage.getItem('interlocutor')
				if (interloc) {
					const storage = JSON.parse(interloc);
					const { user } = storage;
					show_alert(`L'utilisateur ${user.name} s'est déconnecté`, ALERT_TYPE.WARNING);
				} else {
					show_alert(`Un utilisateur s'est déconnecté`, ALERT_TYPE.WARNING);
				}
			});

			ws.on_channel(CHANNELS.ALREADY_CONNECTED, (json: { user: { name: string }, socket_id: number }) => {
				localStorage.setItem('interlocutor', JSON.stringify(json))

				const user_name_html_element = document.querySelector('#interlocutor-name');
				const user_state_html_element = document.querySelector('#interlocutor-state');
				const user_state_html_no_message_element = document.querySelector('.no-message .no-message-header div:nth-child(2) p:nth-child(2)');
				if (user_name_html_element) {
					user_name_html_element.innerHTML = json.user.name;
				}
				if (user_state_html_element) {
					user_state_html_element.innerHTML = INTERLOCUTOR_STATES.ONLINE;
				}
				if (user_state_html_no_message_element) {
					user_state_html_no_message_element.innerHTML = INTERLOCUTOR_STATES.ONLINE;
				}
			})

			ws.on_channel(CHANNELS.MESSAGE, (json: { message: string, date: Date }) => {
				const conv = document.querySelector('.conv');
				if (conv) {
					const no_message_text: HTMLElement|null = document.querySelector('.no-message > p');
					if (no_message_text) {
						no_message_text.style.display = 'none';
					}
					conv.innerHTML += createMessage(json.message, json.date, false);
				}
			})

			ws.on_channel(CHANNELS.IS_WRITTEN, (json: { status: boolean }) => {
				const conv = document.querySelector('.conv');
				if (conv) {
					const writtenElement = conv.querySelector('.talk-loader');
					if (writtenElement) {
						writtenElement.remove();
					}
					if (json.status) {
						conv.innerHTML += isWritten();
					}
				}
			});

			const message_text_element: HTMLInputElement|null = document.querySelector('.group-inp textarea');
			if (message_text_element) {
				message_text_element.addEventListener('input', () => {
					if (message_text_element.value.length > 3) {
						ws.send_channel(CHANNELS.IS_WRITTEN, { status: true });
					} else {
						ws.send_channel(CHANNELS.IS_WRITTEN, { status: false });
					}
				});

				message_text_element.addEventListener('blur', () => {
					ws.send_channel(CHANNELS.IS_WRITTEN, { status: false });
				})
			}

			const message_form_button = document.querySelector('.group-inp + .submit-msg-btn');
			if (message_form_button) {
				message_form_button.addEventListener('click', (e: any) => {
					e.preventDefault();

					const message: HTMLInputElement|null = document.querySelector('.group-inp textarea');
					const message_text = message ? message.value : ''

					const objectToSend = {
						message: message_text,
						date: new Date()
					};

					ws.send_channel(CHANNELS.MESSAGE, objectToSend)
					if (message) {
						message.value = '';
					}

					const conv = document.querySelector('.conv');
					if (conv) {
						const no_message_text: HTMLElement|null = document.querySelector('.no-message > p');
						if (no_message_text) {
							no_message_text.style.display = 'none';
						}
						conv.innerHTML += createMessage(objectToSend.message, objectToSend.date, true);
					}
				})
			}

			ws.listen();
		}
	});
}
