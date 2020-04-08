// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const DataStore = require('./Datastore.js');
const clsDataStore = new DataStore();

const { ipcRenderer } = require('electron');

// Delete Todo by getting text (to match against data)
const deleteTodo = e => {

	ipcRenderer.send('delete-todo', e.target.parentElement.getElementsByTagName('span')[0].textContent);

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
	const todoItems = todos.reduce((html, todo, idx) => {

		html+= `<li class="todo-item js-todo-item" data-index="${idx}">
					<label>
						<input type="checkbox" class="js-complete-todo">
						<span>${todo.name}</span>
					</label>
					<svg class="todo-delete js-delete-todo" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
				</li>`;

		return html;

	}, '');

	// Set the list items in the list
	todoList.innerHTML = todoItems;

	// Complete items
	// Delete items
	todoList.querySelectorAll('.js-todo-item').forEach(item => {

		// Trash icon
		item.querySelector('.js-delete-todo').addEventListener('click', deleteTodo);

		// Completed
		item.querySelector('.js-complete-todo').addEventListener('change', e => {
			// console.log(todos.indexOf(e.target.parentElement.getElementsByTagName('span')[0].textContent));
			item.classList.toggle('todo-complete');

			todos[item.dataset.index] = {
				name: e.target.parentElement.getElementsByTagName('span')[0].textContent,
				completed: true
			}

			clsDataStore.updateTodos(todos);
			ipcRenderer.send('update-todos');

			console.log(todos);
		});

	});

});
