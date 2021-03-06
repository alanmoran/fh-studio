var userController,
    renderer = require("../util"),
    fhc = require('../fh-module');

userController = {
    checkAuth: function(req, res, next){

      //TODO: COuld do with some tidying up

      var fhcUser = "",//fhc.fhc.config.get('username'),
      fhcCookie = req.session.login || "",//fhc.fhc.config.get('cookie'),
      fhcDomain = req.session.domain,
      fhcHost = "https://demo2.feedhenry.com/", //fhc.fhc.config.get('feedhenry'),
      loggedIn  = (req.session && req.session.user) ? req.session.user : false,
      env = req.app.settings.env;
      
      // Set env as a parameter on the request, so we can append it to our data later in doResponse
      req.params.env = env;
      req.session.host = fhcHost;

      if(!req.session.domain) {
        var rex = /https?:\/\/([a-zA-Z0-9]+)\.feedhenry.com/g;
        var match = rex.exec(fhcHost);
        if (match && match.length && match.length>=2){
          fhcDomain = match[1];
          req.session.domain = fhcDomain;
        }
      }
     
      if (env==="local" && fhcUser && fhcCookie){
        req.session.user = {
          username:fhcUser,
          timestamp:'',
          role:'dev' //TODO: Have FHC pass this through
        };
        req.session.login = fhcCookie;

        next();
        return true;
      }
          
      if (loggedIn){
        next();
        return true;
      } else{
        req.session.afterLogin = (req.url==="/login") ? "/home" : req.url;
        res.redirect('/login');
        return false;  
      }
    },
    signupAction:function (req, res) {
        var d;
        if (req.method === "POST") {
            //handle signup alternatively we could create a second method for
            //proccessing new signup and use app.post route
        } else if (req.method === "GET") {
            d = {
                tpl:'register',
                title:'Register'
            };
            renderer.doResponse(req, res, d);
        }
    },
    loginAction:function (req, res) {
        var username, password, d, body, args;
        if (req.method === "POST") {
            //again this could be moved to a seperate method if it was
            //thought neccessary
            try {
                body = req.body,
                username = body.username,
                password = body.password;
                req.session.username = username,

                fhc.auth.login({
                  host: "https://demo2.feedhenry.com",
                  domain: "demo2"
                }, username, password, function (err, data) {
                    if (err) {
                        renderer.doError(res,req, "Error logging in as user <strong>" + username + "</strong>. Please verify credentials and try again.");
                        return;
                    }
                    console.log(data);
                    // Success! Let's set some session properties.
                    req.session.user = {
                        username:username,
                        timestamp:data.timestamp,
                        role: 'dev' //TODO: Have FHC pass this through
                    };
                    req.session.login = data.login;
                    req.session.domain = (data.domain) ? data.domain : "demo2";
                    if (req.session.afterLogin){
                      res.redirect(req.session.afterLogin);
                      req.session.afterLogin = null; // reset our afterLogin URL
                    }else{
                      res.redirect('/home');
                    }

                });
            } catch (ex) {

            }
        } else if (req.method === "GET") {

            d = {
                tpl:'login',
                title:'login'
            };
            renderer.doResponse(req, res, d);
        }
    },
    logoutAction:function (req, res) {
        try {
          fhc.auth.logout(req.session, function (err, data) {
              console.log(arguments);
              req.session.destroy();
              if (err) {
                  renderer.doError(res,req, "Error logging out");
                  return; // TODO: Show error logging out page
              }
              res.redirect('/');
          });
        } catch (ex) {
            renderer.doError(res,req,"error");
        }
    },
    myAccountAction: function(req, res){
      var d;
      d = {
        tpl:'account',
        title:'My Account'
      };
      renderer.doResponse(req, res, d);


    }
};


module.exports = userController;