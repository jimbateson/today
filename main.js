'use strict';

// Modules to control application life and create native browser window
const {app} = require('electron');

// Get our window class
const Window = require('./Window');

function main()
{

	let mainWindow = new Window({
		file: 'index.html'
	});

}

// Create window when ready

app.on('ready', main);

app.on('window-all-closed', () => {

	app.quit();

});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
