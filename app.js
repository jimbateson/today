const Store = require('electron-store');
const store = new Store();

// Handle our data
const DataStore = require('./dataStore');

// Create a new todo store name "Todos Main"
const todosData = new DataStore({
	name: 'Todos Main'
});

class Todos {
	constructor(settings) {
		// Init with our todos or an empty array
		this.arrTodos = store.get('todos') || [];
	}

	init() {
		this.startApp();
	}

	startApp() {
		const self = this;

		new Vue({
			el: '.js-todo-app',
			data() { 
				return {
					newTodo: '',
					todos: store.get('todos')
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
					store.set('todos', this.todos);
				}
			}
		});
	}
}

const clsTodos = new Todos();
clsTodos.init();
