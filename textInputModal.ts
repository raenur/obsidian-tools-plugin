import {App, Modal} from "obsidian";

export class TextInputModal extends Modal {
	private inputText: string
	summary: HTMLElement
	private currentYearString: string
	private date: Date;
	private callbackEnter: (text: string, date?: Date, tags?: string[]) => void
	private callbackInput: (text: string) => void;
	private inputTextArea: HTMLElement;

	constructor(app: App) {
		super(app);

		this.inputTextArea = this.contentEl.createEl('div').createEl('textarea', {
			type: 'text',
			cls: 'input-modal',
			value: '',
			attr: {
				rows: 8,
				cols: 60
			}
		});
		let button = this.contentEl.createEl('div').createEl('button',{
			text: 'Confirm'
		})
		this.inputTextArea.addEventListener('input', (event: InputEvent) => {
			// console.log(event);

			// @ts-ignore
			this.inputText = event.target.value;
			if (this.callbackInput) {
				this.callbackInput(this.inputText);
			}

		});
		button.addEventListener('click', () => {
			this.callConfirmCallback();
		})
		this.inputTextArea.addEventListener('keydown', (event: KeyboardEvent) => {

			if (event.key == 'Enter' && event.ctrlKey) {
				this.callConfirmCallback();
			}
		})
		this.summary = this.contentEl.createDiv().createEl('p');
	}

	private callConfirmCallback() {
		if (this.callbackEnter === undefined) {
			console.log('TextInputModal: No enter callbackEnter defined');
		} else {
			this.callbackEnter(this.inputText);
		}
	}

	onInput(callback: (text: string) => void): TextInputModal {
		this.callbackInput = callback;
		return this;
	}

	onEnter(callback: (text: string, date?: Date, tags?: string[]) => void): TextInputModal {
		this.callbackEnter = callback;
		return this;
	}

	setInput(text: string) {
		this.inputText = text;
		this.inputTextArea.setText(text);
	}
}
