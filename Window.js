const { BrowserWindow } = require('electron');

// The default window settings

const defaultProps = {
	height: 800,
	minHeight: 500,
	minWidth: 500,
	show: false,
	width: 500
};

class Window extends BrowserWindow {
	constructor ({ file, ...windowSettings })
	{

		// Calls a new window with the above properties
		// Our default ones and any custom passed?
		super({ ...defaultProps, ...windowSettings });

		// Load html file and open devtools?
		// TODO: What does this mean?
		this.loadFile(file);

		// Remove devtools for now
		//this.webContents.openDevTools();

		// Prevent flicker when ready to show
		if(windowSettings.showOnLoad)
		{

			this.once('ready-to-show', () => {
				this.show();
			});

		}

	}
}

module.exports = Window
