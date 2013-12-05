function descriptionTable() {
  var table = new $_.Table();
  table.addColumn("name", null, $_.Type.string);
  table.addColumn("description", null, $_.Type.string);
  table.addColumn("modified", null, $_.Type.date);
  table.add({
    name : "a",
    description : "a",
    modified : new Date()
  });
  table.add({
    name : "a",
    description : "b",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "a",
    description : "t",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "b",
    description : "a",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "b",
    description : "m",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "c",
    description : "l",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "c",
    description : "q",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "x",
    description : "a",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "x",
    description : "x",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "x",
    description : "y",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "x",
    description : "z",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "z",
    description : "a",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  table.add({
    name : "z",
    description : "x",
    modified : new Date(new Date().getTime() - 60 * 60 * 24 * 365)
  });
  return table;
}

if (Meteor.isClient) {
  // Template.hello.greeting = function () {
  // return "Welcome to app.";
  // };

  var d = descriptionTable();
  Template.table.tview = new $_.TableView(d)

  /*
   * Template.hello.events({ 'click input' : function () { // template data, if
   * any, is available in 'this' if (typeof console !== 'undefined')
   * console.log("You pressed the button"); } });
   */
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    // code to run on server at startup
  });
}
