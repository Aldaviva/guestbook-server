var _      = require('lodash');
var auth   = require('../auth/auth');
var config = require('../common/config');
var logger = require('../common/logger')(module);
var apiServer = require('./apiServer');

var defaultContext = {
    config: _.pick(config, ['httpServer', 'floorplan', 'catalyst'])
};

apiServer.get('/', function(req, res){
    res.render('index', {});
});

apiServer.get('/dashboard', auth.requireAdminUser, function(req, res){
    var context = _.merge({
        user: req.user,
        toastMessage: getAndRemoveToastMessage(req)
    }, defaultContext);

    res.render('dashboard', context);
});

function getAndRemoveToastMessage(req){
    var toastMessage = req.session.toastMessage;
    req.session.toastMessage = null;
    return toastMessage;
}