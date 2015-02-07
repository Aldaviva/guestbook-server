var db = require('../db');

var visitSchema = new db.Schema({
    visitorName    : { type: 'String', required: true },
    visitorCompany : { type: 'String', required: true },
    hostName       : { type: 'String', required: true },
    hostId         : { type: 'String', required: true, validate: /^[0-9a-f]{24}$/ },
    startTime      : { type: 'Moment', required: true, index: true }
});

visitSchema.set('versionKey', false);

module.exports = db.model('Visit', visitSchema);