import * as vscode from 'vscode';

const pluginKeyword = 'mermaid'

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('vscode-markdown-jstype.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vscode-markdown-jsType!');
	});

	context.subscriptions.push(disposable);

	return {
		extendMarkdownIt(md) {
				const highlight = md.options.highlight;
				md.options.highlight = (code, lang) => {
						if (lang && lang.match(/\bmermaid\b/i)) {
								return `<div class="${pluginKeyword}">${preProcess(code)}</div>`;
						}
						return highlight(code, lang);
				};
				return md;
		}
	}
}

export function deactivate() {}

const preProcess = (/** @type {string} */source) =>
    source
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;');
