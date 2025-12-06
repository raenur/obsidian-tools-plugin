import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import {Obj} from "tern";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	intentionPath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	intentionPath: 'intentions'
}

export default class NathTools extends Plugin {
	settings: MyPluginSettings;

	createNote(filePath: string, content: string, properties?: any) {
		this.app.vault.create(`${filePath}.md`, content)
			.then((createdFile: TFile) => {

			if (properties != undefined) {
				this.app.fileManager.processFrontMatter(createdFile, (frontMatter) => {
					Object.assign(frontMatter, properties);
				}).then((value) => {
					console.log(`Applied properties to "${createdFile.name}"`);
					console.log(properties);
				})
			}
		})
			.catch((reason) => {
				new Notice(reason);
			})
	}

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('NS Tools active');

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		this.addCommand({
			id: 'intention-from-selection',
			name: 'Create intention from selection',
			editorCallback: (editor: Editor) => {
				let filename = `${editor.getSelection()}.md`;

				this.createIntention(editor.getSelection());
			}
		})

		this.addCommand({
			id: 'task-from-selection',
			name: 'Create task note from selected text',
			editorCallback: (editor: Editor) => {
				let filename = `${editor.getSelection()}`;

				let taskContent = editor.getSelection();
				this.createTask(taskContent);
			}
		})

		this.addCommand({
			id: 'create-task-popup',
			name: 'Create task',
			callback: () => {
				new StringInputModal(this.app, 'Create Task', (text) => console.log(text)).open();
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

	}

	private async createIntention(intentionContent: string) {
		//Check intention path has value
		if(this.settings.intentionPath === ''){
			new Notice('No intention path defined');
			return;
		}

		//Check intention folder
		if(!this.app.vault.getFolderByPath(this.settings.intentionPath)) {
			await this.app.vault.createFolder(this.settings.intentionPath);
		}

		this.createNote(`${this.settings.intentionPath}/Intention-${Date.now()}`, intentionContent, {
			'intention date': new Date(),
			'intention statement': intentionContent,
			Stage: 'created'
		});
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

class StringInputModal extends Modal {

	inputString: string

	constructor(app: App, title: string, onEnter: (text: string) => void) {
		super(app);
		this.setTitle(title);

		this.contentEl.createEl('input', {type: 'text', cls: 'stringInput'});

		this.containerEl.addEventListener("keydown", (event) => {
			console.log(event);
			if (event.key == 'Enter') {
				this.close();
				onEnter(this.inputString)
			}
		})
	}
}

class TestModal extends Modal {
	constructor(app: App, onOK: (text: string) => void) {
		super(app);
		this.setTitle('Enter some text');

		let name = '';
		new Setting(this.contentEl)
			.setName('Text')
			.addText((text) => {
					text.onChange((value) => {
						name = value;
					})
				}
			);
		new Setting(this.contentEl)
			.addButton((btn) =>
				btn.setButtonText('OK')
					.setCta()
					.onClick(() => {
						this.close();
						onOK(name);
					})
			);
		this.containerEl.addEventListener("keydown", (event) => {
			console.log(event);
			if (event.key == 'Enter') {
				this.close();
			}
		})
	}
}


class SampleSettingTab extends PluginSettingTab {
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
