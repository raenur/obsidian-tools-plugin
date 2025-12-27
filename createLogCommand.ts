import {App, Command, TFile} from "obsidian";
import {TextInputModal} from "./textInputModal";
import ToolsPlugin from "./main";

export class CreateLogCommand implements Command {
	private app: App;
	callback: () => void;
	id: string = 'create-log';
	name: string = 'Create daily log';
	private plugin: ToolsPlugin;

	constructor(app: App, plugin: ToolsPlugin) {
		this.app = app;
		this.plugin = plugin;
		this.callback = this.createLog;
	}


	private createLog() {
		let inputModal = new TextInputModal(this.app);
		inputModal
			.setTitle(this.name)
			.onEnter(async (text) => {

				if (!this.app.vault.getFolderByPath(this.plugin.settings.dailyLogPath)) {
					await this.app.vault.createFolder(this.plugin.settings.dailyLogPath);
				}

				let dailylogFileName = `daily-log-${new Date().toISOString().substring(0, 10)}.md`

				let dailyLogFilePath = `${this.plugin.settings.dailyLogPath}/${dailylogFileName}`;
				if (this.app.vault.getFileByPath(dailyLogFilePath) === null) {
					await this.plugin.createNote(dailyLogFilePath, `# Daily Log ${new Date().toLocaleDateString()}\n`)
				}

				let dailylogFile = this.app.vault.getFileByPath(dailyLogFilePath);

				let logTime = new Date().toLocaleTimeString();
				if (dailylogFile instanceof TFile) {
					this.app.vault.append(dailylogFile, `\n## ${logTime}\n ${text}`).then(() => {
						console.log('Nath tools: log appended');
						inputModal.close();
						this.plugin.lastLogInput = '';
					})
				}
			})
			.onInput(text => {
				this.plugin.lastLogInput = text;
			});
			if(this.plugin.lastLogInput !== ''){
				inputModal.setInput(this.plugin.lastLogInput);
			}


			inputModal.open()
	}
}
