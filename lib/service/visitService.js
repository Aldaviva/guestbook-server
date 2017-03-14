var _        = require('lodash');
var Visit    = require('../data/model/Visit');
var config   = require('../common/config');
var logger   = require('../common/logger')(module);
var mediator = require('../common/mediator');
var Moment   = require('moment');
var request  = require('pr-request2');

module.exports = {
    create      : create,
    find        : find,
    findById    : findById,
    findByDate  : findByDate,
    updateFull  : _.partial(update, false),
    updateDelta : _.partial(update, true),
    toCSV       : toCSV
};

function create(visit){
    delete visit._id;
    _.extend(visit, {
        startTime: new Moment()
    });

    var savePromise = visit.savePromise();

    savePromise.then(function(){
        logger.info({ visit: visit }, "Created new visit.");
        mediator.publish("visit:created", visit);
    });

    return savePromise;
}

function update(isPatch, visit){
    var id = visit._id;
    delete visit._id;

    return Visit.findByIdAndUpdatePromise(id, visit, { overwrite: !isPatch });
}

/**
 * @query criteria to match documents, or null to match all documents
 * @param filterOpts: { pageSize: 0, pageNum: 0, sort: { startTime: -1 }}
 */
function find(query, filterOpts){
    filterOpts = _.defaults(filterOpts || {}, { pageSize: 0, pageNum: 0 });
    if(filterOpts.pageNum > 0 && filterOpts.pageSize === 0){
        filterOpts.pageSize = 100;
    }

    var findOpts = _.extend({ sort: { startTime: -1 } }, {
        limit: filterOpts.pageSize,
        skip: filterOpts.pageNum * filterOpts.pageSize
    });

    return Visit.findPromise(query, null, findOpts);
}

function findByDate(dateCriteria){
    dateCriteria = _.defaults(dateCriteria || {}, {
        minDate: null,
        maxDate: null
    });

    var query = {};
    _.merge(query,
        dateCriteria.minDate ? { startTime: { $gte: dateCriteria.minDate.valueOf() }} : null,
        dateCriteria.maxDate ? { startTime: { $lte: dateCriteria.maxDate.valueOf() }} : null
    );

    return find(query, null);
}

function findById(id){
    return Visit.findByIdPromise(id);
}

function toCSV(visits){
    return "startTime,visitorName,visitorCompany,hostName\r\n"
        + visits.map(function(visit){
            return _.map([
                visit.startTime.format('M/D/YY h:mm a'),
                visit.visitorName,
                visit.visitorCompany,
                visit.hostName
            ], _escapeCsvString).join(",");
        }).join('\r\n');
}

function _escapeCsvString(str){
    return (_.isString(str)) ? '"'+str.replace(/"/g, '""')+'"' : "";
} 
