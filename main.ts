import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import {TextInputModal} from "./textInputModal";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	intentionPath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	intentionPath: 'intentions'
}

export default class NathTools extends Plugin {
	settings: MyPluginSettings;

	createNote(filePath: string, content: string, properties?: any): Promise<void> {

		return new Promise<void>((resolve, reject) => {
			this.app.vault.create(`${filePath}.md`, content)
				.then((createdFile: TFile) => {

					if (properties != undefined) {
						this.app.fileManager.processFrontMatter(createdFile, (frontMatter) => {
							Object.assign(frontMatter, properties);
						}).then((value) => {
							console.log(`Applied properties to "${createdFile.name}"`);
							console.log(properties);
							resolve();
						})
					}
				})
				.catch((reason) => {
					reject(reason);
				})
		})
	}

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('NS Tools active');

		this.addCommand({
			id: 'intention-from-selection',
			name: 'Create intention from selection',
			editorCallback: async (editor: Editor) => {
				let selection = editor.getSelection();
				// this can only work if I get the filename back from creating intention
				let fileName = await this.createIntention(selection);
				editor.replaceSelection(`[[${fileName}|${selection}]]`)
			}
		})

		this.addCommand({
			id: 'create-intention',
			name: 'Create Intention',
			callback: () => {
				new TextInputModal(this.app)
					.setTitle("Describe intention")
					.onEnter((text, date, tags) => {
						console.log(text);
						console.log(date);
						this.createIntention(text, date, tags);
					}).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GeneralSettingTab(this.app, this));

	}

	private async createIntention(intentionString: string, date?: Date, tags?: string[]) {
		//Check intention path has value
		if (this.settings.intentionPath === '') {
			new Notice('No intention path defined');
			return;
		}

		//Check intention folder
		if (!this.app.vault.getFolderByPath(this.settings.intentionPath)) {
			await this.app.vault.createFolder(this.settings.intentionPath);
		}

		let fileName = this.getFileName(`intention ${intentionString}`);
		await this.createNote(`${this.settings.intentionPath}/${fileName}`, intentionString, {
			'intention date': date ? date : new Date(),
			'intention statement': intentionString,
			Stage: 'created',
			tags: tags
		});
		return fileName;

	}

	private getFileName(textToUse: string) {
		return `${Date.now()}-${textToUse.replace(/\s/g, '-')}`;
	}

	private createTask(taskContent: string) {
		this.createNote(taskContent, taskContent, {
			'Target Date': new Date()
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class GeneralSettingTab extends PluginSettingTab {
	plugin: NathTools;

	constructor(app: App, plugin: NathTools) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Intention Path')
			.setDesc('Path for intention notes')
			.addText(text => text
				.setPlaceholder('Enter path')
				.setValue(this.plugin.settings.intentionPath)
				.onChange(async (value) => {
					this.plugin.settings.intentionPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
