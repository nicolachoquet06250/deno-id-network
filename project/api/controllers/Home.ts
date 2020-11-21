import { Controller, Get, InjectedProperty } from "../../lib/decorators/mod.ts";
import { Context, CustomRouter } from "../../lib/http/mod.ts";

@Controller()
export class Home {

	@InjectedProperty({ type: Context })
	private context?: Context;

	@InjectedProperty({ type: CustomRouter })
	private router?: CustomRouter;

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
			const { DOMAIN, SECURE } = Deno.env.toObject();

			// @ts-ignore
			const url = `http${(Boolean(parseInt(SECURE)) ? 's' : '')}://${(DOMAIN ? DOMAIN : this.context.request().url.hostname)}${this.router.url(
				'ts_file', 
				{ file: 'app' }
				)}`

			this.context.init_headers({ 'Content-Type': 'text/html' }).respond(`
				<!DOCTYPE html>
				<html lang="fr">
					<head>
						<meta charset="utf8" />
						<title>Test de Websockets</title>
						
						<link rel="icon" 
							  type="image/x-icon" 
							  href="${this.router ? this.router.url('favicon') : ''}" />
						<link rel="shortcut icon" 
							  type="image/x-icon" 
							  href="${this.router ? this.router.url('favicon') : ''}" />
							  
						<link rel="stylesheet" href="${this.router ? this.router.url(
							'css_file', { 
								file: 'app' 
							}) : ''}">
					</head>
					<body>
					
						<div class="conv-container">
						
							<div class="login-overlay">
								<div class="login-modal">
									<form action="" class="login-form">
										<input type="text" class="name" id="name" placeholder="Your name" />
										<input type="submit" value="Se connecter">
									</form>
								</div>
							</div>
							
							<div class="conv-nav-top">
								<div class="location">
						                <img src="${this.router ? this.router.url(
										'classic_images', {
											name: 'left-chevron',
											ext: 'svg'
										}) : ''}" alt="chevron back">
						            <p>Back</p>
						        </div>
						
						        <div class="user">
						            <p id="interlocutor-name">John Doe</p>
						            <p id="interlocutor-state">Active Now</p>
						        </div>
						
						        <div class="logos-call">
						                <img src="${this.router ? this.router.url(
										'classic_images', {
											name: 'phone',
											ext: 'svg'
										}) : ''}" alt="call">
						                <img src="${this.router ? this.router.url(
										'classic_images', {
											name: 'video-camera',
											ext: 'svg'
										}) : ''}" alt="visio">
						        </div>
							</div>
							
							<div class="alert danger hide">
								Une erreur est survenu lors de la connexion
							</div>
							
							<div class="conv">
								<div class="talk left">
									<img src="${this.router ? this.router.url(
										'classic_images', { 
											name: 'avatar2', 
											ext: 'jpg' 
										}) : ''}" alt="">
									<p>Lorem ipsum dolor sit amet.</p>
								</div>
								<div class="talk right">
									<p>Lorem ipsum dolor sit amet.</p>
									<img src="${this.router ? this.router.url(
										'classic_images', { 
											name: 'avatar1', 
											ext: 'jpg' 
										}) : ''}" alt="">
								</div>
								<div class="talk left">
									<img src="${this.router ? this.router.url(
										'classic_images', { 
											name: 'avatar2', 
											ext: 'jpg' 
										}) : ''}" alt="">
									<p>Lorem ipsum dolor sit amet.</p>
								</div>
								<div class="talk right">
									<p>Lorem ipsum dolor sit amet.</p>
									<img src="${this.router ? this.router.url(
										'classic_images', { 
											name: 'avatar1', 
											ext: 'jpg' 
										}) : ''}" alt="">
								</div>
							</div>
							
							<form action="" class="conv-form">
								<div class="input-container">
									<div class="files-logo-cont">
						                <img src="${this.router ? this.router.url(
						                	'classic_images', {
						                		name: 'paperclip',
												ext: 'svg'
											}) : ''}" alt="">
						            </div>
						
						            <div class="group-inp">
						                <textarea placeholder="Enter your message here" minlength="1" maxlength="1500"></textarea>
						                <img src="${this.router ? this.router.url(
											'classic_images', {
												name: 'smile',
												ext: 'svg'
											}) : ''}" alt="">
						            </div>
						
						
						            <button class="submit-msg-btn">
						                <img src="${this.router ? this.router.url(
										'classic_images', {
											name: 'send',
											ext: 'svg'
										}) : ''}" alt="">
						            </button>
								</div>
							</form>
						</div>
						
						<script src="${url}"></script>
					</body>
				</html>
			`);
		}
	}
}
