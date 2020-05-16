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

// Our Add todo window
let mainWindow;
let addTodoWin;

function main()
{

	// Set the file to the todo list
	mainWindow = new Window({
		file: 'index.html',
		showOnLoad: true
	});

	mainWindow.once('show', () => {

		mainWindow.webContents.send('todos', todosData.todos);
		mainWindow.setMenu(null);

	});

	// If the window does not already exist
	createToDo();

	// Create our add todo window
	ipcMain.on('add-todo-window', () => {

		createToDo();
		addTodoWin.show();

	});

	ipcMain.on('update-todos', (_event, todos) => {

		const updatedTodos = todosData.updateTodos(todos).todos;

		mainWindow.send('todos', updatedTodos);

	});

	// Add a todo from our add todo window!
	ipcMain.on('add-todo', (_event, todo) => {

		const updatedTodos = todosData.addTodo(todo).todos;

		mainWindow.send('todos', updatedTodos);

	});

	// Delete a todo from our main todos window
	ipcMain.on('delete-todo', (_event, todo) => {

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

function createToDo()
{
	if (!addTodoWin) {

		// Create the window using our window class
		addTodoWin = new Window({
			file: 'add.html',
			//frame: false,
			height: 400,
			// Set parent window to main, so it will close if the main one is closd?
			parent: mainWindow,
			width: 400
		});

		addTodoWin.setMenu(null);

		addTodoWin.on('closed', () => {

			addTodoWin = null;
			createToDo();

		});

	}

}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
