// Client-side JavaScript, bundled and sent to client.


Slincks = new Meteor.Collection("slincks");
Todos = new Meteor.Collection("todos");

// ID of currently selected list
Session.setDefault('path', null);

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
var listsHandle = Meteor.subscribe('slincks', function () {
  if (!Session.get('path')) {
    var slinck = Slincks.findOne({}, {sort: {name: 1}});
    if (slinck)
      Router.setPath(slinck.name);
  }
});

var todosHandle = null;
// Always be subscribed to the todos for the selected list.
Deps.autorun(function () {
  var path = Session.get('path');
  console.log("autorun:"+path);
  if (path)
    todosHandle = Meteor.subscribe('todos', path);
  else
    todosHandle = null;
});


////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};

////////// Lists //////////





/*
Template.lists.events({
  'mousedown .list': function (evt) { // select list
    Router.setPath(this.name);
  },
  'click .list': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'click #newslincksubmit' :  function (evt) {
      var name = $('#new-name').val();
      Slincks.insert({
        name: name, 
        path: $('#new-path').val()
      });
      $('#new-name').val('');
      $('#new-path').val('');
      Router.setPath(name);
      evt.target.value = "";
    }
});*/

Handlebars.registerHelper('key_value', function(context, options) {
  var result = [];
  _.each(context, function(value, key, list){
    result.push({key:key, value:value});
  });
  return result;
});

Template.breadcrumb.sl = function () {
  var path = Session.get('path');
  if (path)
    return new $_.Slinck(path);
  else
    return  null;
};

var TodosRouter = Backbone.Router.extend({
  routes: {
    "*path": "pathRoute"
  },
  pathRoute: function (path) {
    console.log("pathRoute:"+path);
    var oldpath = Session.get("path");
    if (oldpath !== path) {
      Session.set("path", path);
    }
  },
  setPath: function (path) {
    console.log("setPath:"+path);
  this.navigate(path, true);
  }
});

Router = new TodosRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

Meteor.startup(function(){
  var cm = CodeMirror(
      $('#view')[0], {
        value: "",
        mode:  "sliki",
      });
  cm.on('change',  function(){
       var h = new $_.Sliki(cm.getDoc().getValue()).render();
       $('#sliki').html(h);
  });
});




