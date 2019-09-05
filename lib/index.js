const Framework = require("./framework");
const framework = new Framework();

function init(config, logger) {
	framework.init({config, logger});
}

init.$inject = ["config", "logger"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--beforeMiddleware": ["factory", function() {
		return framework.beforeMiddleware();
	}],
	"middleware:ui5--middleware": ["factory", function() {
		return framework.middleware();
	}]
};
