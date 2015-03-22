var apiServer = require('../api/apiServer');
var logger    = require('../common/logger')(module);
var passport  = require('passport');

apiServer.get('/logout', function(req, res){
	req.logout();
	req.setToastMessage("info", "auth.logged_out");
	res.redirect('/');
});

apiServer.get('/login', passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'
]}));

apiServer.get('/auth/google/callback', passport.authenticate('google', { 
    failureRedirect: '/logged-out'
}), afterLogin);

function afterLogin(req, res){
    var redirectPath = req.session.afterLoginRedirect || ('/dashboard');
    res.redirect(redirectPath);
}
