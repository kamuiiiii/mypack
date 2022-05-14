const nodeExternals = require("webpack-node-externals");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  return {
    mode: argv.mode,
    target: "node",
    externals: [nodeExternals()],
    entry: "./src/index.ts",
    devtool: isProduction ? false : "source-map",
    output: {
      filename: "index.js",
      clean: true,
      library: {
        type: "commonjs",
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|mjs|ts)$/,
          loader: "babel-loader",
          exclude: /node_modules/,
          options: {
            cacheDirectory: true,
          },
        },
      ],
    },
  };
};
