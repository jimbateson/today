'use strict';

// Modules to control application life and create native browser window
//const path = require('path');
const { app, ipcMain } = require('electron');

// Get our window class
const Window = require('./window');
// Handle our data
const DataStore = require('./dataStore');

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

	// Add main todo window
	let addTodoWin;

	mainWindow.once('show', () => {

		mainWindow.webContents.send('todos', todosData.todos);

	});

	// Create our add todo window
	ipcMain.on('add-todo-window', () => {

		// If the window does not already exist
		if(!addTodoWin)
		{

			// Create the window using our window class
			addTodoWin = new Window({
				file: 'add.html',
				height: 400,
				// Set parent window to main, so it will close if the main one is closd?
				parent: mainWindow,
				width: 400
			});

			addTodoWin.on('closed', () => {

				addTodoWin = null;

			});

		}

	});

	// Add a todo from our add todo window!
	ipcMain.on('add-todo', (event, todo) => {

		const updatedTodos = todosData.addTodo(todo).todos;

		mainWindow.send('todos', updatedTodos);

	});

	// Delete a todo from our main todos window
	ipcMain.on('delete-todo', (event, todo) => {

		const updatedTodos = todosData.deleteTodo(todo).todos;

		mainWindow.send('todos', updatedTodos);

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
