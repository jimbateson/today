const Store = require('electron-store');

class DataStore extends Store {
	constructor(settings)
	{

		super(settings);

		// Init with our todos or an empty array
		this.todos = this.get('todos') || [];

	}

	saveTodos()
	{

		// Save the todos to a JSON file
		this.set('todos', this.todos);

		return this;

	}

	getTodos()
	{

		this.todos = this.get('todos') || [];

		return this;

	}

	addTodo(todo)
	{

		// Merge todos array with the new todo
		this.todos = [...this.todos, todo];

		// Re-set the todos
		return this.saveTodos();

	}

	deleteTodo(todo)
	{

		// Filter out the todo we want to delete
		this.todos = this.todos.filter(t => t !== todo);

		// Re-set the todos
		return this.saveTodos();

	}
}

module.exports = DataStore;
