const Store = require('electron-store');

class DataStore extends Store {
	constructor(settings)
	{

		super(settings);

		// Init with our todos or an empty array
		this.todos = this.get('todos') || [];

	}
}

module.exports = DataStore;
