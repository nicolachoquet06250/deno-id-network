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
							const pipe = new WebSocket("ws://" + window.location.hostname.replace('http', 'ws') + "/messages"); 
			
							function fire(ev){     
								switch(ev.type){     
									case 'message':         
										switch(typeof ev.data){         
											case 'string':             
												console.log('msg text', ev.data);         
												break;         
												case 'object':             
													ev.data.arrayBuffer().then(ab => { 
														console.log(new Uint8Array(ab)); 
													});         
													break;         
										}     
										break;     
									default:         
										console.log(ev.type ,ev);     
								} 
							} 
							
							function hello(msg){     
								if(msg === undefined){         
									msg = new ArrayBuffer(4);        
									const uint = new Uint8Array(msg); 
									uint[0] = 4;    
									uint[1] = 3;    
									uint[2] = 2;    
									uint[3] = 1;  
								}  
								pipe.send(msg); 
							}  
							
							pipe.addEventListener('open', fire); 
							pipe.addEventListener('close', fire); 
							pipe.addEventListener('message', fire); 
							pipe.addEventListener('error', fire);
						</script>
					</body>
				</html>
			`);
		}
	}
}
