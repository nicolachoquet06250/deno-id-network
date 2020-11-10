import { WebView } from "https://deno.land/x/webview/mod.ts";

// Fetching Bitcoin Price Index data from CoinDesk
fetch("https://api.coindesk.com/v1/bpi/historical/close.json")
	.then(resp => resp.json())
	.then(bpiData => {
		// Rendering the Denjucks template from the index.html file, including in
		// data for the Bitcoin Price Index when rendering the template
		// @ts-ignore
		const renderedTemplate = `<!DOCTYPE html>
<html lang="fr">
	<head>
	    <style>
	        html, body {
	            background-color: #111111;
	            color: #eeeeee;
	        }
	
	        h1 {
	            text-align: center;
	        }
	    </style>
	
	    <!--
	        Including the Plotly.js library. In production applications this
	        library will be linked to a file on the disk instead of pulled from
	        the web.
	    -->
	    <script src="https://cdn.plot.ly/plotly-1.53.0.min.js"></script>
	</head>
	<body>
		<h1>Bitcoin Price Index</h1>
		<div id="BitcoinChart"></div>
		
		<!--
		    Code to create the chart. First the Bitcoin Price Index data is added
		    to the JavaScript code when the template gets rendered. Then Plotly is
		    used to generate a chart.
		 -->
		<script>
			let bpiData = ${JSON.stringify(bpiData.bpi)};
		
			let chart = Plotly.newPlot(
				document.querySelector("#BitcoinChart"),
				[
					{
						x: Object.keys(bpiData),
						y: Object.values(bpiData),
						type: "scatter",
						mode: "lines",
						line: {
							color: "#FF0000",
							width: 2.5,
						},
					},
				],
			);
		</script>
	</body>
</html>
`;

		let html = `data:text/html,${renderedTemplate}`;

		// Creating the webview with the rendered template
		let webview = new WebView({
			title: "Deno Cryptocurrency Webview",
			url: html,
			width: 800,
			height: 600,
			resizable: true,
			debug: true,
			frameless: false
		});

		// Running the webview
		webview.run()
	}).catch(err => {

	// Creating some HTML markup to display the error message
	let html = `
            data:text/html,
            <html lang="fr">
                <body>
                    <h1>Error</h1>
                    <p>${err}</p>
                </body>
            </html>`;

	// Creating a webview with the error if something failed while running the
	// application
	let webview = new WebView({
		title: "Deno Cryptocurrency Webview ERROR",
		url: html,
		width: 500,
		height: 400,
		resizable: true,
		debug: true,
		frameless: false
	});

	// Running the webview with the error message
	webview.run();
});
