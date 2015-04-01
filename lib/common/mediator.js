var Mediator = require('mediator-js');
var apiServer =  require('../api/apiServer');

var mediator = new Mediator.Mediator();
module.exports = mediator;

mediator.subscribe('visit:created', function(visit){
    apiServer.io.sockets.emit('visit:created');
});