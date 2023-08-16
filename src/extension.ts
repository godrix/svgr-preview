import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('svgr-preview.preview', (uri: vscode.Uri) => {

		if (uri) {
			const filePath = uri.fsPath;

			fs.readFile(filePath, 'utf-8', (err, data) => {
				if (err) {
					vscode.window.showErrorMessage(`Error reading the file: ${err.message}`);
				} else {
					if (hasSVGExport(data)) {				
						
						const svgContentMatch = data.match(svgContentRegex);

						if (svgContentMatch) {
							const svgContent = svgContentMatch[1]; 
							const lowerCaseSvg = convertSvgToLowerCase(svgContent)
							const svgr = modifiedSVG(lowerCaseSvg)

							const panel = vscode.window.createWebviewPanel(
								'svgr-preview',
								'SVGR Preview',
								vscode.ViewColumn.Two,
								{}
							);

							panel.webview.html = getWebviewContent(svgr);
						} else {
							vscode.window.showErrorMessage("No SVGs found");
						}

					} else {
						vscode.window.showInformationMessage('The file does not contain an SVG.');
					}
				}
			});
		} else {
			vscode.window.showErrorMessage('No file selected.');
		}

	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

function getWebviewContent(svg: string) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>SVGR Preview</title>
  </head>
  <body style="background:#FAFAFA;padding:1rem">
	<svg  width: "125",
	height: "16",
	fill: "none",
	viewBox: "0 0 125 16">
	  ${svg}
		<svg/>
  </body>
  </html>`;
}

const svgContentRegex = /<svg[^>]*>([\s\S]*?)<\/svg>/i;

function hasSVGExport(content: string): boolean {
	const svgExportRegex = /<svg[^>]*>[\s\S]*<\/svg>/gmi;
	return svgExportRegex.test(content);
}

function convertSvgToLowerCase(svgString: string) {
	return svgString.replace(/<([A-Za-z][A-Za-z0-9]*)/g, (match, p1) => {
		return `<${p1.toLowerCase()}`;
	});
}

function modifiedSVG(svgString: string) {
	return svgString.replace(/\b(?:fill|stroke|stop-color|color|text-fill-color|text-stroke)\s*=\s*{([^}]+)}/g, (match, p1) => {
		return match.replace(p1, "#000").replace(/{|}/g, '')
	});
}
