import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class NathTools extends Plugin {
	settings: MyPluginSettings;

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
			id: 'task-from-selection',
			name: 'Create task note from selected text',
			editorCallback: (editor: Editor) => {
				let filename = `${editor.getSelection()}.md`;

				this.app.vault.create(filename,'note content').then((createdFile: TFile) => {
					this.app.fileManager.processFrontMatter(createdFile,(frontMatter) => {
						frontMatter['Target Date'] = new Date();
					})
				})
			}
		})

		this.addCommand({
			id: 'create-task-popup',
			name: 'Create task',
			callback: () => {
				let modal = new Modal(this.app);
				modal.containerEl.setText('balls');
				modal.open();
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

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
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
