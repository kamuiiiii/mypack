const nodeExternals = require("webpack-node-externals");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  return {
    mode: argv.mode,
    target: "node",
    externals: [nodeExternals()],
    entry: {
      bundler: "./src/bundler.ts",
    },
    devtool: isProduction ? false : "eval-cheap-module-source-map",
    output: {
      filename: "[name].js",
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
