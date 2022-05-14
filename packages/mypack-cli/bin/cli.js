const { program } = require("commander");
const { default: Bundler } = require("mypack");
const { default: Server } = require("mypack-dev-server");
const chokidar = require("chokidar");
const open = require("react-dev-utils/openBrowser");
const path = require("path");
const { throttle } = require("lodash");

const DEFAULT_ENTRY = "src/index.js";
const DEFAULT_OUTPUT = "dist";
const DEFAULT_FILE_NAME = "index.js";

let bundler;

const build = async (options) => {
  const {
    entry = DEFAULT_ENTRY,
    output = DEFAULT_OUTPUT,
    filename = DEFAULT_FILE_NAME,
    port,
  } = options;
  bundler = new Bundler({ entry, output, filename, port });
  await bundler.build();
};

const watch = (server) => {
  const sourceDir = path.resolve("src");
  const wacther = chokidar.watch(sourceDir);
  const handle = throttle(
    async (path) => {
      const chunk_id = path.split(/\/(src\/.*)/)[1];
      const asset = bundler.assetMap.get(chunk_id);
      if (asset.reload) {
        await bundler.rebuild(chunk_id);
        server.reload();
      } else {
        await bundler.update(chunk_id);
        server.update(chunk_id);
      }
      console.log(`update ${chunk_id}`);
    },
    1000,
    { leading: true, trailing: false }
  );
  wacther.on("change", handle);
};

program
  .option("-o, --output <path>")
  .option("-f, --filename <name>")
  .action(build);

program
  .command("serve")
  .description("start the server")
  .option("-p, --port <port>", "port to listen on", parseInt)
  .action(async (options, cmd) => {
    const { output, filename } = cmd.optsWithGlobals();
    const { port } = options;
    await build({ output, filename, port });
    const server = new Server(port, output);
    server.start();
    watch(server);
    open(`http://localhost:${port}`);
  });

program.parse();
