import {EventType, MessageType, WebSocketClient} from "./websocket/lib/WebSocketClient.ts";

const ws = new WebSocketClient(
	window.location.hostname,
	undefined,
	(window.location.protocol === 'https:'),
	'/messages'
);

ws.on(EventType.ERROR, (e: any) => {
	console.error('error', e.error.message);
}).on(EventType.CLOSE, (e: any) => {
	console.warn('close', e.event);
}).on(EventType.OPEN, (e: any) => {
	console.log('open', e.event);
	ws.send({ hello: "World" });
});

ws.on(EventType.MESSAGE, (e: any) => {
	console.log(e.message, 'json');
}, MessageType.JSON)

ws.on(EventType.MESSAGE, (e: any) => {
	console.log(e.message, 'text');
}, MessageType.TEXT).listen();
