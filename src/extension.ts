import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import { TypeFun } from './typeFun';


const pluginKeyword = 'mermaid'
const langJson = 'language-object'

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('vscode-markdown-jstype.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vscode-markdown-jsType!');
	});

	context.subscriptions.push(disposable);

	return {
		extendMarkdownIt(md: any) {
				const highlight = md.options.highlight;
				md.options.highlight = (code: string, lang: string) => {
						if (lang && lang.match(/\bmermaid\b/i)) {
							return `<div class="${pluginKeyword}">${preProcess(code)}</div>`;
						}
						if (lang && lang.match(/\btype\b/i)) {
							const ast = parse(code, {
								sourceType: "module",
								plugins: [
									[
										"flow", {}
									],
								]
							});
							const obj = TypeFun(ast)
							return `<div class="${langJson}">${JSON.stringify(obj)}</div>`;
						}
						return highlight(code, lang);
				};
				return md;
		}
	}
}

export function deactivate() {}

const preProcess = (source: string) =>
    source
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;');
