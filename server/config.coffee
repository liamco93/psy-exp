exports.confMail =
  smtp:
    service: "Gmail"
    auth:
      user: "lc73571n9@gmail.com"
      pass: "?"
  content:
    from: "Test Bot \<lc73571n9@gmail.com\>"

exports.confSite =
  rootUrl: "http://evening-fortress-9193.herokuapp.com/"
  dbUrl: "mongodb://admin:admin@ds031087.mongolab.com:31087/heroku_app28365881"
  adminUser:
    "admin": "admin"