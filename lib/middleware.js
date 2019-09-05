const connect = require("connect");
const normalizer = require("@ui5/project").normalizer;
const middlewareRepository = require("@ui5/server").middlewareRepository;
const ui5Fs = require("@ui5/fs");
const resourceFactory = ui5Fs.resourceFactory;
const ReaderCollectionPrioritized = ui5Fs.ReaderCollectionPrioritized;
const httpProxy = require("http-proxy");

const {replaceLast} = require("./utils");

class Middleware {
	constructor() {
		this.config = {};
		this.isPaused = true;
		this.queue = [];

		this.beforeHandler = connect().use(this.handleBefore);
		this.handler = connect().use(this.handleRewriteUrl);
	}

	async init(config) {
		this.config = config;

		const {ui5, beforeMiddleware, middleware, basePath} = this.config;

		beforeMiddleware.push("ui5--beforeMiddleware");
		middleware.push("ui5--middleware");

		if (ui5.url) {
			this.initProxy(ui5.url);
		} else if (ui5.useMiddleware !== false) { // TODO: remove
			await this.initUI5Middleware(basePath);
		}

		this.processRequests();
	}

	initProxy(url) {
		const proxy = httpProxy.createProxyServer({
			target: url,
			changeOrigin: true
		});

		this.handler.use(proxy.web);
	}

	async initUI5Middleware(basePath) {
		const tree = await normalizer.generateProjectTree({
			cwd: basePath
		});

		const projectResourceCollections = resourceFactory.createCollectionsForTree(tree);

		const workspace = resourceFactory.createWorkspace({
			reader: projectResourceCollections.source,
			name: tree.metadata.name
		});

		const all = new ReaderCollectionPrioritized({
			name: "server - prioritize workspace over dependencies",
			readers: [workspace, projectResourceCollections.dependencies]
		});

		const resources = {
			rootProject: projectResourceCollections.source,
			dependencies: projectResourceCollections.dependencies,
			all
		};

		this.handler.use(middlewareRepository.getMiddleware("serveResources")({resources}));
		this.handler.use(middlewareRepository.getMiddleware("serveThemes")({resources}));
	}

	handleBefore(req, res, next) {
		req.url = this.rewriteUrlBefore(req.url);
		if (this.isPaused) {
			this.queue.push(next);
		} else {
			next();
		}
	}

	handleRewriteUrl(req, res, next) {
		req.url = this.rewriteUrl(req.url);
		next();
	}

	processRequests() {
		if (!this.isPaused) {
			throw new Error("Requests have already been processed!");
		}
		this.isPaused = false;
		this.queue.forEach(function(next) {
			next();
		});
		this.queue = [];
	}

	rewriteUrl(url) {
		const type = this.config.ui5.type;
		const webappFolder = this.config.ui5.paths.webapp;
		const srcFolder = this.config.ui5.paths.src;
		const testFolder = this.config.ui5.paths.test;
		if (!type) {
			// TODO: do we want no type to be allowed?
			return url;
		} else if (type === "application") {
			const webappPattern = new RegExp(`^/base/${webappFolder}/`);
			if (webappPattern.test(url)) {
				return url.replace(webappPattern, "/");
			}
		} else if (type === "library") {
			const srcPattern = new RegExp(`^/base/${srcFolder}/`);
			const testPattern = new RegExp(`^/base/${testFolder}/`);
			// const basePattern = /^\/base\//; // TODO: is this expected?
			if (srcPattern.test(url)) {
				return url.replace(srcPattern, "/resources/");
			} else if (testPattern.test(url)) {
				return url.replace(testPattern, "/test-resources/");
			} /* else if (basePattern.test(url)) {
				return url.replace(basePattern, "/");
			}*/
		} else {
			//this.logger.log("error", ErrorMessage.urlRewriteFailed(type));
			return;
		}

		return url;
	}

	rewriteUrlBefore(url) {
		const {type, paths} = this.config;
		if (!type) {
			// TODO: do we want no type to be allowed?
			return url;
		} else if (type === "application") {
			return url; // no rewrite required
		} else if (type === "library") {
			const srcFolder = paths.src;
			const testFolder = paths.test;

			const srcResourcesPattern = new RegExp(`^/base/${replaceLast(srcFolder, "resources/")}`);
			const srcTestResourcesPattern = new RegExp(`^/base/${replaceLast(srcFolder, "test-resources/")}`);
			const testResourcesPattern = new RegExp(`^/base/${replaceLast(testFolder, "resources/")}`);
			const testTestResourcesPattern = new RegExp(`^/base/${replaceLast(testFolder, "test-resources/")}`);

			if (srcResourcesPattern.test(url)) {
				return url.replace(srcResourcesPattern, `/base/${srcFolder}/`);
			} else if (srcTestResourcesPattern.test(url)) {
				return url.replace(srcTestResourcesPattern, `/base/${testFolder}/`);
			} else if (testResourcesPattern.test(url)) {
				return url.replace(testResourcesPattern, `/base/${srcFolder}/`);
			} else if (testTestResourcesPattern.test(url)) {
				return url.replace(testTestResourcesPattern, `/base/${testFolder}/`);
			}
		} else {
			// this.logger.log("error", ErrorMessage.urlRewriteFailed(type));
			// TODO
			return;
		}

		return url;
	}
}

module.exports = Middleware;
