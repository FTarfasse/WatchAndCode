/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.bindEvents();

      new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');      
		},
		getId: function(id) {
			return document.getElementById(id);
		},
        getClass: function(elClass) {
			return document.getElementsByClassName(elClass);
		},
		bindEvents: function () {
			// $('#new-todo').on('keyup', this.create.bind(this));
            this.getId('new-todo').addEventListener('keyup', this.create.bind(this), false);
			// $('#toggle-all').on('change', this.toggleAll.bind(this));
            this.getId('toggle-all').addEventListener('change', this.toggleAll.bind(this), false);
			// $('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
		    this.getId('footer').addEventListener('click', function(e){
				if(e.target.id === 'clear-completed') {
                    e.target.addEventListener('click', App.destroyCompleted(e), false)
				} else {
					return;
				}
			}, false);
			
            this.getId('todo-list').addEventListener('change', function(e){
                if(e.target.className === 'toggle') {
                    e.target.addEventListener('change', App.toggle(e), false)
                } else {
                    return;
                }
            }, false)

            this.getId('todo-list').addEventListener('dblclick', function(e){
                if(e.target.tagName === 'LABEL') {
                    e.target.addEventListener('dblclick', App.edit(e), false)
                } else {
                    return;
                }
            }, false)

            this.getId('todo-list').addEventListener('keyup', function(e) {
                if(e.target.className === 'edit') {
                    e.target.addEventListener('keyup', App.editKeyup(e), false)
                } else {
                    return;
                }
			}, false)
			
            this.getId('todo-list').addEventListener('focusout', function(e){
                if(e.target.className === 'edit') {
                    e.target.addEventListener('focusout', App.update(e), false)
                } else {
                    return;
                }
			})
			
            this.getId('todo-list').addEventListener('click', function(e) {
                if(e.target.className === 'destroy') {
                    e.target.addEventListener('click', App.destroy(e), false)
                } else {
                    return;
                }
            }, false)
    	},
		// $('#todo-list')
		// .on('change', '.toggle', this.toggle.bind(this))
		// .on('dblclick', 'label', this.edit.bind(this))
		// .on('keyup', '.edit', this.editKeyup.bind(this))
		// .on('focusout', '.edit', this.update.bind(this))
		// .on('click', '.destroy', this.destroy.bind(this));
		// },
		render: function () {
			var todos = this.getFilteredTodos();
			// $('#todo-list').html(this.todoTemplate(todos));
			// var filledTemplate = this.todoTemplate(todos);
			// console.log(filledTemplate);
			// var filledTemplateHtml = filledTemplate.innerHTML // these solutions did at best the insertion of a string of the template
			// this.getId('todzo-list').after(filledTemplate); // these solutions did at best the insertion of a string of the template
			// this.getId('todo-list').appendChild(filledTemplate); // these solutions did at best the insertion of a string of the template
			this.getId('todo-list').innerHTML = '';
    		this.getId('todo-list').insertAdjacentHTML('afterbegin', this.todoTemplate(todos));

			// $('#main').toggle(todos.length > 0);
			if(todos.length > 0) {
				this.getId('main').setAttribute("style", "display: block");
			};

			// $('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			// GOAL : if active todos === 0, document.getElementById('toggle-all').attributes.id.ownerElement.checked must be true
			if(this.getActiveTodos().length === 0) {
				document.getElementById('toggle-all').attributes.id.ownerElement.checked = true;
			} else {document.getElementById('toggle-all').attributes.id.ownerElement.checked = false;
			};
      
			this.renderFooter();
			// $('#new-todo').focus();
			this.getId('new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			// $('#footer').toggle(todoCount > 0).html(template);
      		if(this.todos.length > 0) {
      		  this.getId('footer').innerHTML = '';
						this.getId('footer').setAttribute("style", "display: block");
      		  this.getId('footer').insertAdjacentHTML('afterbegin', template);
					} else {
      		  this.getId('footer').setAttribute("style", "display: none");
      		};
    },
      // this.getId('footer').innerHTML = '';
		  // if(todoCount > 0) {
		  // this.getId('footer').insertAdjacentHTML('afterbegin', this.template);
		  // }
		  // }
		toggleAll: function (e) {
			// var isChecked = $(e.target).prop('checked');
      
      	// var eVal = e.target.attributes.id.ownerElement.checked;
      	// var isChecked = !Boolean(eVal);
    		var isChecked = e.target.attributes.id.ownerElement.checked;

    		this.todos.forEach(function (todo) {
    		todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (e) {
			// var id = $(el).closest('li').data('id');
      		var myLi = e.closest('li') 
      		var id = myLi.getAttribute('data-id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
        create: function (e) {
            var targetEl = e.target
                // var newTodoId = document.getElementById('new-todo');
            var iDvalue = targetEl.value;
            var val = iDvalue.trim();

            if (e.which !== ENTER_KEY || !val) {
            return;
            }
            this.todos.push({
            id: util.uuid(),
            title: val,
            completed: false
            });

            targetEl.value = null;
            this.render();
		},
		toggle: function (e) {
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		edit: function (e) {
            var targetE = e.target // get the target element
            // gets the closest li
            var parentLi = targetE.closest('li'); // add the class .editing to it
            parentLi.setAttribute('class', 'editing') // finds the element with the class .edit
            var findTheInput = parentLi.querySelector('.edit') // finds the first child element of li having the edit class
            findTheInput.focus() // sets the focus to the associated input field
        },
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				// $(e.target).data('abort', true).blur();
        		// e.target.value = null;
				// e.target.value = this.todos[this.indexFromEl(e)].title;
        		// e.target.value = null;
        		// e.target.value = this.todos[this.indexFromEl(e)].title;
        		// e.value = this.todos[this.indexFromEl(e.target)].title;
            	e.target.value = this.todos[this.indexFromEl(e.target)].title;
				e.target.blur();
			}
		},
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			if ($el.data('abort')) {
				$el.data('abort', false);
			} else {
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
		},
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
});