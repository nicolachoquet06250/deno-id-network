export enum HTTP_METHODS {
	GET = 'get',
	POST = 'post',
	PUT = 'put',
	DELETE = 'delete',
}

export enum EVENTS {
	ABORT = 'abort',
	OPEN = 'open',
	ERROR = 'error',
	CLOSE = 'close',
	MESSAGE = 'message'
}

export enum MESSAGE_TYPE {
	JSON = 'json',
	TEXT = 'text',
	BINARY = 'binary',
	PING = 'ping',
	CLOSE = 'close',
	BUFFER = 'buffer'
}

export enum ALERT_TYPE {
	ERROR = 'error',
	WARNING = 'warn',
	SUCCESS = 'success'
}

export enum CHANNELS {
	NEW_CONNEXION = 'new_connexion',
	DISCONNECT = 'disconnect',
	ALREADY_CONNECTED = 'already_connected',
	MESSAGE = 'message',
	IS_WRITTEN = 'is_written'
}

export enum INTERLOCUTOR_STATES {
	ONLINE = 'Active Now',
	OFFLINE = 'Inactive Now'
}
