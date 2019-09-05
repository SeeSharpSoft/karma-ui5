const Middleware = require("../../lib/middleware");

describe("rewriteUrlBefore", () => {
	const assertRewriteUrlBefore = (middleware, [url, expectedUrl]) => {
		expect(middleware.rewriteUrlBefore(url)).toEqual(expectedUrl);
	};

	it("Should not rewrite urls for application", () => {
		const middleware = new Middleware();
		middleware.init({
			type: "application"
		});
		assertRewriteUrlBefore(middleware, [
			"/base/resources/sap/ui/foo/library.js",
			"/base/resources/sap/ui/foo/library.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/test-resources/sap/ui/foo/test.js",
			"/base/test-resources/sap/ui/foo/test.js"
		]);
	});

	it("Should rewrite urls for library", () => {
		const middleware = new Middleware();
		middleware.init({
			type: "library",
			paths: {
				src: "src",
				test: "test"
			}
		});
		assertRewriteUrlBefore(middleware, [
			"/base/resources/sap/ui/foo/library.js",
			"/base/src/sap/ui/foo/library.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/test-resources/sap/ui/foo/test.js",
			"/base/test/sap/ui/foo/test.js"
		]);
	});

	it("Should rewrite urls for library with custom paths", () => {
		const middleware = new Middleware();
		middleware.init({
			type: "library",
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		});
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/resources/sap/ui/foo.js",
			"/base/src/main/js/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/test-resources/sap/ui/foo/test.js",
			"/base/src/test/js/sap/ui/foo/test.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/resources/sap/ui/foo.js",
			"/base/src/main/js/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/test-resources/sap/ui/foo/test.js",
			"/base/src/test/js/sap/ui/foo/test.js"
		]);
	});

	it("Should not rewrite unrelated urls for library", () => {
		const middleware = new Middleware();
		middleware.init({
			type: "library",
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		});
		assertRewriteUrlBefore(middleware, [
			"/context.html",
			"/context.html"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/foo.js",
			"/base/foo.js"
		]);
	});

	it("Should not rewrite url when no type is given", () => {
		const middleware = new Middleware();
		middleware.init({});

		assertRewriteUrlBefore(middleware, [
			"/base/resources/sap/ui/foo/library.js",
			"/base/resources/sap/ui/foo/library.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/test-resources/sap/ui/foo/test.js",
			"/base/test-resources/sap/ui/foo/test.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/resources/sap/ui/foo.js",
			"/base/src/main/resources/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/test-resources/sap/ui/foo/test.js",
			"/base/src/main/test-resources/sap/ui/foo/test.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/resources/sap/ui/foo.js",
			"/base/src/test/resources/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/test-resources/sap/ui/foo/test.js",
			"/base/src/test/test-resources/sap/ui/foo/test.js"
		]);
	});

	/*
	it("Should throw error when invalid type is given", () => {
		framework.config.ui5.type = "foo";

		const loggerSpy = jest.spyOn(framework.logger, "log");
		framework.rewriteUrlBefore("/foo");
		expect(loggerSpy).toBeCalled();
	});
	*/
});
