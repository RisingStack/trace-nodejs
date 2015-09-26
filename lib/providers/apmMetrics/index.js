var usage = require('usage');

function ApmMetrics(eventBus) {
  this.pid = process.pid;
  this.eventBus = eventBus;
  this.collectInterval = 10 * 1000;

  var _this = this;

  this.interval = setInterval(function() {
    _this.getMetrics();
  }, this.collectInterval);
}

ApmMetrics.prototype.getMetrics = function() {
  var _this = this;

  usage.lookup(this.pid, function (err, results) {
    if (err) {
      return _this.eventBus.emit(_this.eventBus.ERROR, err);
    }
    _this.eventBus.emit(_this.eventBus.APM_METRICS, {
      timestamp: (new Date()).toISOString(),
      memory: {
        used: results.memoryInfo.rss,
        free: results.memoryInfo.vsize
      },
      cpu: {
        utilization: results.cpu
      }
    });
  });
};

function create(eventBus) {
  return new ApmMetrics(eventBus);
}

module.exports.create = create;
