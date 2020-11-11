module.exports = function(config) {
  config.set({
    mutate: ["src/**/*.js"],
    mutator: "javascript",
    htmlReporter: {
      baseDir: 'coverage/mutation/html'
    },
    packageManager: "npm",
    reporters: ["clear-text", "progress", "html"],
    testRunner: "jest",
    coverageAnalysis: "off"
  });
};
