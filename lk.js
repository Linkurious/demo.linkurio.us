
var lk = (function() {
  var self = {};

  if (typeof $ === 'undefined') throw new Error('"jQuery" is not declared');
  if (typeof chance === 'undefined') throw new Error('"chance" is not declared');

  self.getUrlVar = function (key) {
    var match = new RegExp('[?&]' + key + '=([^&#]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1]) || "";
  };

  self.email = self.getUrlVar('u');

  self.generateEmail = function () {
    self.email = self.getUrlVar('u') || chance.email();
  };

  self.register = function (button) {
    var demoUrl = 'http://crunchbase.linkurio.us/';

    var wrappedButton = $('#registerBtn');
    var buttonText = wrappedButton.html();
    button.form.action = demoUrl + 'api/auth/loginRedirect';

    wrappedButton.addClass('disabled');
    wrappedButton.html('Creating account...');
    self.generateEmail();

    console.log('created fake email: ' + self.email);

    wrappedButton.html('Login as "' + self.email + '" ...');
    $('input#usernameOrEmail').val(self.email);
    $('input#password').val('demo');

    var fail = function fail(step, errorData, message) {
      wrappedButton.removeClass('disabled');
      wrappedButton.html(buttonText);
      console.log(step + ' error: ' + JSON.stringify(errorData, null, ' '));
      alert(message + '\nPlease let us know at contact@linkurio.us');
    };

    $.support.cors = true;
    // login as admin
    $.ajax({
      type: 'POST',
      cache: false,
      url: demoUrl + 'api/auth/login',
      data: JSON.stringify({"usernameOrEmail": "admin", "password": "demo_admin"}),
      processData: false,
      contentType: 'application/json',
      dataType: "json"
    }).fail(function (data) {
      fail('admin login', data, "Unable to connect to the demo.");
    }).done(function() {
      console.log('logged in');

      // register the user
      $.ajax({
        type: 'POST',
        cache: false,
        url: demoUrl + 'api/admin/users',
        data: JSON.stringify({username: self.email, email: self.email, password: 'demo'}),
        processData: false,
        contentType: 'application/json'
      }).fail(function (data) {
        fail('user create', data, "Could not create your demo account.");
      }).done(function() {
        console.log('demo account created');

        // log out the admin
        $.ajax(demoUrl + 'api/auth/logout').fail(function (data) {
          fail('admin logout', data, "Something went wrong while creating your demo account.");
        }).done(function() {
          console.log('logged out');

          $('#registerBtn').html('Loading the demo ...');

          $(window.parent.document.getElementById('login-header')).hide();
          $(window.parent.document.getElementById('demo-header')).show();

          button.form.submit();
        });
      });
    });
  };

  return self;
})();
