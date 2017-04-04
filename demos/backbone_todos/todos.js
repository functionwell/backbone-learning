jQuery(function($){

  //创建基本的Todo模型，有content和done属性, toggle方法翻转done属性
  window.Todo = Backbone.Model.extend({
    defaults: {
      done: false
    },

    toggle: function(){
      this.save({done: !this.get('done')});
    }
  });

  //设置TodoList集合，保存Todo模型数组
  window.TodoList = Backbone.Collection.extend({
    model: Todo,

    localStorage: new Store('todos'),

    done: function(){
      return this.filter(function(todo){return todo.get('done');});
    },

    remaining: function(){
      return this.without.apply(this, this.done());
    }
  });

  //创建全局集合
  window.Todos = new TodoList;

  //显示单独的todo视图
  window.TodoView = Backbone.View.extend({
    tagName: 'li',

    //为每个单独的项都缓存一个模板函数
    template: $('#item-template').template(),

    //给视图委托事件
    events: {
      'change   .check'        : 'toggleDone',
      'dblclick .todo-content' : 'edit',
      'click    .todo-destroy' : 'destroy',
      'keypress .todo-input'   : 'updateOnEnter',
      'blur     .todo-input'   : 'close'
    },

    initialize: function(){
      //确保在正确的作用域调用函数
      _.bindAll(this, 'render', 'close', 'remove', 'edit');

      //监听模型的改变
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    render: function(){
      //使用存储的模板来更新el
      var element = jQuery.tmpl(this.template, this.model.toJSON());
      $(this.el).html(element);
      this.input = this.$('.todo-input');
      return this;
    },

    //当复选框被选中时，就将模型切换为已完成状态
    toggleDone: function(){
      this.model.toggle();
    },

    //当视图切换为‘编辑’模式，显示input输入框
    edit: function(){
      $(this.el).addClass('editing');
      this.input.focus();
    },

    //关闭‘编辑’模式, 将更改保存至to-do列表中
    close: function(e){
      this.model.save({content: this.input.val()});
      $(this.el).removeClass('editing');
    },

    //如果按下了回车键，则结束编辑状态
    //调用close()，触发input的blue事件
    updateOnEnter: function(e){
      if(e.keyCode == 13){e.target.blur();}
    },

    //当模型被销毁时也删除元素
    remove: function() {
      $(this.el).remove();
    },

    //当单击‘.todo-destroy’时销毁模型
    destroy: function(){
      this.model.destroy();
    }

  });

  //整个AppView时顶层的UI片段
  window.AppView = Backbone.View.extend({

    //给现有的app骨架绑定已有的html，而不是创建新元素
    el: $('#todoapp'),

    statsTemplate: $('#stats-template').template(),

    events: {
      'keypress #new-todo'  : 'createOnEnter',
      'click .todo-clear a' : 'clearCompleted'
    },

    //在初始化时，将相关的事件绑定给了Todos集合
    //当添加或者修改集合中的元素时触发这些事件
    //通过载入可能存在本地存储中的记录来给出初始数据
    initialize: function(){
      _.bindAll(this, 'addOne', 'addAll', 'render');

      this.input = this.$('#new-todo');

      Todos.bind('add', this.addOne);
      Todos.bind('refresh', this.addAll);
      Todos.bind('all', this.render);

      Todos.fetch();
    },

    //重新渲染视图意味着刷新状态
    //app的其余部分不变
    render: function(){
      var done = Todos.done().length;
      var element = jQuery.tmpl(this.statsTemplate, {
        total:     Todos.length,
        done:      Todos.done().length,
        remaining: Todos.remaining().length
      });
      this.$('#todo-stats').html(element);
    },

    //创建一个视图并将这个元素绑定到<ul>中
    //以此为列表添加一个单独的todo项
    addOne: function(todo){
      var view = new TodoView({model: todo});
      this.$('#todo-list').append(view.render().el);
    },

    //一次性将所有项都添加到Todos集合中
    addAll: function(){
      Todos.each(this.addOne);
    },

    //如果在主输入框域中敲了回车键，则创建一个新的Todo模型
    createOnEnter: function(e){
      if(e.keyCode != 13) return;

      var value = this.input.val();
      if(!value) return;

      Todos.create({content: value});
      this.input.val('');

    },

    clearCompleted: function(){
      _.each(Todos.done(), function(todo){todo.destroy();});
      return false;
    }

  });

  //最后，创建一个app
  window.App = new AppView;

});
