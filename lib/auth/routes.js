var apiServer = require('../api/apiServer');
var logger    = require('../common/logger')(module);
var passport  = require('passport');

apiServer.get('/logout', function(req, res){
	req.logout();
	req.setToastMessage("info", "auth.logged_out");
	res.redirect('/dashboard');
});

apiServer.get('/login', 
	passport.authenticate('google', { failureRedirect: '/dashboard' }), afterLogin);

apiServer.get('/auth/google/return',
	passport.authenticate('google', { failureRedirect: '/dashboard' }), afterLogin);

function afterLogin(req, res){
	var redirectPath = req.session.afterLoginRedirect || ('/admin');
	res.redirect(redirectPath);
}
