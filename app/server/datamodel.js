// Lists -- {name: String}
Slincks = new Meteor.Collection("slincks");

// Publish complete set of lists to all clients.
Meteor.publish('slincks', function () {
  return Slincks.find();
});


// Todos -- {text: String,
//           done: Boolean,
//           list_id: String,
//           timestamp: Number}
Todos = new Meteor.Collection("todos");

// Publish all items for requested list_id.
Meteor.publish('todos', function (list_id) {
  check(list_id, String);
  return Todos.find({list_id: list_id});
});

// Files -- {sl: String, content: String }
Files = new Meteor.Collection("files");

Meteor.publish('files', function (sl) {
  check(sl, String);
  return Files.find({sl: sl});
});


