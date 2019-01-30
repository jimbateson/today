'use strict';

// Modules to control application life and create native browser window
const {app} = require('electron');

// Get our window class
const Window = require('./Window');
// Handle our data
const DataStore = require('./DataStore');

// create a new todo store name "Todos Main"
const todosData = new DataStore({
	name: 'Todos Main'
});

todosData
	.addTodo('test todo 1')
	.addTodo('test todo 2')
	.addTodo('test todo 3')
	.deleteTodo('test todo 2');

console.log(todosData.todos);

function main()
{

	// Set the file to the todo list
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
