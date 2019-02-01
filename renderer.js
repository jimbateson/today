// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const { ipcRenderer } = require('electron');

// Delete Tdo by its text value?
const deleteTodo = (e) => {

	ipcRenderer.send('delete-todo', e.target.textContent);

};

// When we want to add a todo, open the window
// I may want to bring this functionality into the main todo window
document.querySelector('.js-add-todo').addEventListener('click', () => {

	ipcRenderer.send('add-todo-window');

});

// Add the todos once received from the data
ipcRenderer.on('todos', (event, todos) => {

	// Our todo ul
	const todoList = document.querySelector('.js-todo-list');

	// Create the html
	const todoItems = todos.reduce((html, todo) => {

		html+= `<li class="todo-item js-todo-item">${todo}</li>`;

		return html;

	}, '');

	// Set the list items in the list
	todoList.innerHTML = todoItems;

	// Add click event to the todo item to delete it
	// I think I will probably add a bin icon or something in the future
	todoList.querySelectorAll('.js-todo-item').forEach(item  => {

		item.addEventListener('click', deleteTodo);

	});

});
