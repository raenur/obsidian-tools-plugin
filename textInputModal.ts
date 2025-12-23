import {App, Modal} from "obsidian";

export class TextInputModal extends Modal {
	private inputText: string
	summary: HTMLElement
	private currentYearString: string
	private date: Date;
	private callback: (text: string, date?: Date, tags?: string[]) => void
	private callbackInput: (text: string) => void;

	constructor(app: App) {
		super(app);

		let inputField = this.contentEl.createEl('textarea', {
			type: 'text',
			cls: 'input-modal',
			value: '',
			attr: {
				rows: 6,
				cols: 50
			}
		});
		inputField.addEventListener('input', (event: InputEvent) => {
			// console.log(event);

			// @ts-ignore
			this.inputText = event.target.value;
			if (this.callbackInput) {
				this.callbackInput(this.inputText);
			}

			//TODO move the date parsing out of the modal
			//try to find a date
			// let result = this.inputText.match(/(?:^|\B)(\d{1,2})\/(\d{1,2})\/(\d{2})|(\d{1,2})\/(\d{1,2})(?:$|\B)/);
			// let result = this.inputText.match(/(?:^|\s)(?<day>\d{1,2})\/(?<month>\d{1,2})(?:\/(?<year>\d{2})|)(?:$|\s)/);
			// if (result) {
			//
			// 	let year;
			//
			// 	// @ts-ignore
			// 	let day = Number.parseInt(result.groups.day);
			// 	// @ts-ignore
			// 	let month = Number.parseInt(result.groups.month) - 1;
			// 	// @ts-ignore
			// 	if (!result.groups.year) {
			// 		year = Number.parseInt(`${this.currentYearString}`);
			// 	} else {
			// 		// @ts-ignore
			// 		year = Number.parseInt(`${this.currentYearString.substring(0, 2)}${result.groups.year}`);
			// 	}
			//
			// 	let dateNow = new Date();
			//
			// 	//try making a date
			// 	this.date = new Date(year, month, day);
			// 	if (this.date < dateNow) {
			// 		this.date.setFullYear(dateNow.getFullYear() + 1);
			// 	}
			// 	this.inputText = this.inputText.replace(result[0], '');
			// 	//show date to confirm it's captured
			// 	this.summary.setText(this.date.toDateString());
			// } else {
			// 	this.summary.setText('');
			// }

		});
		inputField.addEventListener('keydown', (event: KeyboardEvent) => {


			//TODO move the tags logic out of the modal

			if (event.key == 'Enter' && event.ctrlKey) {

				if (this.callback === undefined) {
					console.log('TextInputModal: No enter callback defined');
				} else {
					this.callback(this.inputText);
				}
			}
		})
		this.summary = this.contentEl.createDiv().createEl('p');
	}

	onInput(callback: (text: string) => void): TextInputModal {
		this.callbackInput = callback;
		return this;
	}

	onEnter(callback: (text: string, date?: Date, tags?: string[]) => void): TextInputModal {
		this.callback = callback;
		return this;
	}
}
