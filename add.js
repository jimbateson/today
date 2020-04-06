// Send the new todo to the main process

'use strict';

const { ipcRenderer } = require('electron');

// On form submit
document.querySelector('.js-add-todo-form').addEventListener('submit', (evt) => {

	//Prevent default refresh when form submitted (incase we want to add another todo)
	evt.preventDefault();

	// Our input
	const input = evt.target[0];

	// Send adding the todo to the main process
	ipcRenderer.send('add-todo', {name: `${input.value}`, completed: false});

	// Rest our input value, ready to add another todo
	input.value = '';

});

