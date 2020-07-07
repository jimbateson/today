const Store = require('electron-store');
const store = new Store();

// Handle our data
const DataStore = require('./dataStore');

// create a new todo store name "Todos Main"
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
					// Initial todos, will need to replace with JSON file?
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
					// The bind on the todo should mean the index gets updated
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