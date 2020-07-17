const Store = require('electron-store');
const dataStore = new Store(
	{
		name: 'today-today'
	}
);

class Todos {
	constructor(settings) {
		// Init with our todos or an empty array
		this.arrTodos = dataStore.get('todos') || [];
	}

	init() {
		this.startApp();
	}

	startApp()
	{

		new Vue({
			el: '.js-todo-app',
			data() { 
				return {
					newTodo: '',
					todos: dataStore.get('todos') || []
				}
			},
			mounted() {
				this.getData();
			},
			methods: {
				getData() {
					this.updateTodos();
				},
				addTodo() {
					if(this.newTodo !== '') {
						this.todos.push({
							title: this.newTodo,
							completed: false
						});

						this.updateTodos();
						// Clear input once added
						this.newTodo = '';
					}
				},
				deleteTodo(index) {
					this.$delete(this.todos, index);
					this.updateTodos();
				},
				updateTodos() {
					dataStore.set('todos', this.todos);
				}
			}
		});

	}
}

const clsTodos = new Todos();
clsTodos.init();
