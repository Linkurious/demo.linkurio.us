var lk = lk || {};

if (typeof jQuery === 'undefined') throw 'jQuery is not declared';
if (typeof chance === 'undefined') throw 'chance is not declared';

lk.getUrlVar = function(key){
  var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
  return result && unescape(result[1]) || "";
};

lk.email = lk.getUrlVar('u');

lk.generateEmail = function () {
  this.email = lk.getUrlVar('u') || chance.email();
  return this;
};

lk.register = function () {
  var self = this;
  var demoUrl = 'http://crunchbase.linkurio.us/';

  $('#registerBtn').addClass('disabled');
  $('#registerBtn').html('Creating account...');

  console.log(self.email);
  jQuery.support.cors = true;

  // login as admin
  $.ajax({
    type: 'POST',
    cache: false,
    url: demoUrl + 'api/auth/login',
    data: JSON.stringify({ "usernameOrEmail": "admin", "password": "demo_admin"}),
    processData: false,
    contentType: 'application/json',
    dataType: "json"
  })

  .fail(function(data) {
    alert( "Unable to log in on the demo. Please contact us at contact@linkurio.us" );
  })

  .done(function() {
    // register the user
    $.ajax({
      type: 'POST',
      cache: false,
      url: demoUrl + 'api/auth/register',
      data: JSON.stringify({ "username": self.email, "email": self.email, "password": "demo"}),
      processData: false,
      contentType: 'application/json'
    })

    .always(function() {
      // log out the admin
      $.ajax(demoUrl + 'api/auth/logout')

      .fail(function(data) {
        alert( "Something went wrong while creating your demo user. Please contact us at contact@linkurio.us" );
      })

      .done(function() {
        // log in as user
        $.ajax({
          type: 'POST',
          cache: false,
          url: demoUrl + 'api/auth/login',
          data: JSON.stringify({ "usernameOrEmail": self.email, "password": "demo"}),
          processData: false,
          contentType: 'application/json',
          withCredentials: true,
          crossDomain: true
        })

        .fail(function(data) {
          alert( "Unable to connect you on the demo. Please contact us at contact@linkurio.us" );
        })

        .done(function (data) {
          $('#registerBtn').css('display', 'none');
          $('#startTxt').css('display', '');
          $('#startBtn').css('display', '');
        });
      });
    });
  });
};
