import {
	App, Command, Editor, editorEditorField, Hotkey, MarkdownFileInfo, MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile
} from 'obsidian';
import {TextInputModal} from "./textInputModal";
import {showTooltip} from "@codemirror/view";
import {CreateLogCommand} from "./createLogCommand";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	intentionPath: string;
	dailyLogPath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	intentionPath: 'intentions',
	dailyLogPath: 'daily log'
}

export default class NathTools extends Plugin {
	settings: MyPluginSettings;
	private currentYearString: string;
	lastLogInput: string = '';

	createNote(filePath: string, content: string, properties?: any): Promise<void> {

		return new Promise<void>((resolve, reject) => {
			this.app.vault.create(`${filePath}`, content)
				.then((createdFile: TFile) => {

					if (properties != undefined) {
						this.app.fileManager.processFrontMatter(createdFile, (frontMatter) => {
							Object.assign(frontMatter, properties);
						}).then(() => {
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

		this.currentYearString = new Date().getFullYear().toString();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('NS Tools active');

		this.addCommand({
			id: 'daily-note-log-prefix',
			name: 'Insert log prefix',
			editorCallback: async(editor: Editor)=> {
				editor.replaceSelection(`${new Date().toLocaleTimeString()} #log `)
			}
		})

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
				let date: Date
				let dateMatchResult: RegExpMatchArray | null
				let inputModal = new TextInputModal(this.app).setTitle("Describe intention");
				inputModal.onEnter((text) => {
					let intentionText = '';
					let tags = [];
					if (dateMatchResult) {
						intentionText = text.replace(dateMatchResult[0], ' ');
					} else {
						intentionText = text;
					}

					let tagsMatch = intentionText.matchAll(/#([a-z0-9]+?)(?:$|\s)/g);
					if (tagsMatch) {
						for (const tag of tagsMatch) {
							tags.push(tag[1]);
							intentionText = intentionText.replace(tag[0], '');
						}
					}
					intentionText = intentionText.trimEnd();
					this.createIntention(intentionText, date, tags);
					inputModal.close();
				});
				inputModal.onInput((text) => {
					dateMatchResult = text.match(/(?:^|\s)(?<day>\d{1,2})\/(?<month>\d{1,2})(?:\/(?<year>\d{2})|)(?:$|\s)/);
					if (dateMatchResult) {

						let year;

						// @ts-ignore
						let day = Number.parseInt(dateMatchResult.groups.day);
						// @ts-ignore
						let month = Number.parseInt(dateMatchResult.groups.month) - 1;
						// @ts-ignore
						if (!dateMatchResult.groups.year) {
							year = Number.parseInt(`${this.currentYearString}`);
						} else {
							// @ts-ignore
							year = Number.parseInt(`${this.currentYearString.substring(0, 2)}${dateMatchResult.groups.year}`);
						}

						let dateNow = new Date();

						//try making a date
						date = new Date(year, month, day);
						if (date < dateNow) {
							date.setFullYear(dateNow.getFullYear() + 1);
						}


						//show date to confirm it's captured
						inputModal.summary.setText(date.toDateString());
					} else {
						inputModal.summary.setText('');
					}
				})
					.open();
			}
		});

		this.addCommand(new CreateLogCommand(this.app, this));

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
		return `${Date.now()}-${textToUse.replace(/\s/g, '-')}.md`;
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
		new Setting(containerEl)
			.setName('Daily Log Path')
			.setDesc('Path for daily log notes')
			.addText(text => text
				.setPlaceholder('Enter path')
				.setValue(this.plugin.settings.dailyLogPath)
				.onChange(async (value) => {
					this.plugin.settings.dailyLogPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
