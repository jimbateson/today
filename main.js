'use strict';

// Modules to control application life and create native browser window
const { app, ipcMain } = require('electron');

// Get our window class
const Window = require('./window');

// Our Add todo window
let mainWindow;

function main()
{

	// Set the file to the todo list
	mainWindow = new Window({
		file: 'index.html',
		showOnLoad: true
	});

	mainWindow.once('show', () => {
		mainWindow.setMenu(null);
	});
}

// Create window when ready
app.on('ready', main);

// Quit the app when all windows are closed?
app.on('window-all-closed', () => {
	app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
