// Generated by CoffeeScript 1.7.1
(function() {
  var nodemailer, sendEmail, settings, smtpTransport;

  nodemailer = require('nodemailer');

  settings = require('../config');

  smtpTransport = nodemailer.createTransport("SMTP", settings.confMail.smtp);

  sendEmail = function(target, subj, content) {
    var mailOptions;
    mailOptions = {
      from: settings.confMail.content.from,
      to: target,
      subject: subj,
      html: content,
      generateTextFromHtml: true
    };
    return smtpTransport.sendMail(mailOptions, function(error, responseStatus) {
      if (error) {
        return console.error(error);
      } else {
        console.log(responseStatus.messageId);
        return console.log(responseStatus.message);
      }
    });
  };

  exports.sendEmail = sendEmail;

}).call(this);

//# sourceMappingURL=emailer.map