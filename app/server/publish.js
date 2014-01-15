// Lists -- {name: String}
Slincks = new Meteor.Collection("slincks");

// Publish complete set of lists to all clients.
Meteor.publish('slincks', function () {
  return Slincks.find();
});


// Todos -- {text: String,
//           done: Boolean,
//           path: String,
//           timestamp: Number}
Todos = new Meteor.Collection("todos");

// Publish all items for requested path.
Meteor.publish('todos', function (path) {
  check(path, String);
  return Todos.find({path: path});
});

