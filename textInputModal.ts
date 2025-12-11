import {App, Modal} from "obsidian";

export class TextInputModal extends Modal {
	private inputText: string
	private summary: HTMLElement
	private currentYearString: string
	private date: Date;
	private callback: (text: string, date?: Date, tags?: string[]) => void

	constructor(app: App) {
		super(app);

		this.currentYearString = new Date().getFullYear().toString();

		let inputField = this.contentEl.createDiv().createEl('input', {
			type: 'text',
			cls: 'input-modal',
			value: ''
		});
		inputField.addEventListener('input', (event: InputEvent) => {
			console.log(event);
			// @ts-ignore
			this.inputText = event.target.value;

			//try to find a date
			// let result = this.inputText.match(/(?:^|\B)(\d{1,2})\/(\d{1,2})\/(\d{2})|(\d{1,2})\/(\d{1,2})(?:$|\B)/);
			let result = this.inputText.match(/(?:^|\s)(?<day>\d{1,2})\/(?<month>\d{1,2})(?:\/(?<year>\d{2})|)(?:$|\s)/);
			if (result) {

				let year;

				let day = Number.parseInt(result.groups.day);
				let month = Number.parseInt(result.groups.month) - 1;
				if (!result.groups.year) {
					year = Number.parseInt(`${this.currentYearString}`);
				} else {
					year = Number.parseInt(`${this.currentYearString.substring(0, 2)}${result.groups.year}`);
				}

				let dateNow = new Date();


				//try making a date
				this.date = new Date(year, month, day);
				if (this.date < dateNow) {
					this.date.setFullYear(dateNow.getFullYear() + 1);
				}
				this.inputText = this.inputText.replace(result[0], '');
				//show date to confirm it's captured
				this.summary.setText(this.date.toDateString());
			} else {
				this.summary.setText('');
			}

			//try and get tags from the input - consider making one regexp so the input format is description - date - tags and groups are named accordingly?
			//or alternatively grab anything before the start of the date match for desc as it's already there

		});
		inputField.addEventListener('keypress', (event: KeyboardEvent) => {
			// console.log(event);
			let tags = [];
			if (event.key == 'Enter') {
				let tagsMatch = this.inputText.matchAll(/#([a-z0-9]+?)(?:$|\s)/g);
				if (tagsMatch) {
					for (const tag of tagsMatch) {
						tags.push(tag[1]);
						this.inputText = this.inputText.replace(tag[0],'');
					}
				}
				this.callback(this.inputText, this.date,tags);
				this.close();
			}
		})
		this.summary = this.contentEl.createDiv().createEl('p');
	}

	onEnter(callback: (text: string, date?: Date, tags?: string[]) => void): TextInputModal {
		this.callback = callback;
		return this;
	}
}
