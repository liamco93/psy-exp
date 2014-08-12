// Generated by CoffeeScript 1.7.1
(function() {
  $('#login').submit(function() {
    console.log(this.user.value);
    console.log(this.pass.value);
    $.post('/admin/login', {
      user: this.user.value,
      pass: this.pass.value
    }).done(function() {
      $('#resultLogin').empty();
      return location.reload();
    }).fail(function(data) {
      return $('#resultLogin').html('Wrong username or password');
    });
    return false;
  });

}).call(this);

//# sourceMappingURL=admin-login.map
