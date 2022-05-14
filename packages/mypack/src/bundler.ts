import fsp from "fs/promises";
import path from "path";
import * as babel from "@babel/core";
import { IAsset, IDependency, IGraph } from "./bundler.interface";

class Bundler {
  assetMap: Map<string, IAsset>;

  config: {
    entry: string;
    output: string;
    filename: string;
    port: number;
  };

  constructor({ entry, output, filename, port = 8080 }) {
    this.assetMap = new Map<string, IAsset>();
    this.config = { entry, output, filename, port };
  }

  async createAsset(id: string): Promise<IAsset> {
    const content = await fsp.readFile(id, "utf-8");
    const ast = await babel.parseAsync(content);
    const dependencies: Array<IDependency> = [];
    babel.traverse(ast, {
      ImportDeclaration: (path) => {
        dependencies.push({ path: path.node.source.value, async: false });
      },
      // dynamic import
      CallExpression: (path) => {
        if (path.node.callee.type === "Import") {
          path.traverse({
            StringLiteral: ({ node }) => {
              dependencies.push({ path: node.value, async: true });
            },
          });
        }
      },
    });

    let { code } = await babel.transformFromAstAsync(ast, content, {
      plugins: [
        path.resolve(__dirname, "../plugins/plugin-transform-module.js"),
      ],
    });
    const mapping = {};
    const dirname = path.dirname(id);
    dependencies.forEach((dependency) => {
      const depId = path.join(dirname, dependency.path);
      mapping[dependency.path] = depId;
      if (dependency.async) {
        const name = "./" + depId.replace(/\//g, "-");
        code = code.replace(dependency.path, name);
      }
    });
    return { id, dependencies, code, mapping };
  }

  async getOrCreateAsset(id: string, options?: { async: boolean }) {
    let asset: IAsset;
    if (this.assetMap.has(id)) {
      asset = this.assetMap.get(id);
    } else {
      asset = await this.createAsset(id);
      this.assetMap.set(id, asset);
    }
    if (options && options.async) {
      asset.reload = true;
    }
    return asset;
  }

  async createGraphs(entry: string): Promise<Array<IGraph>> {
    const graphs: Array<IGraph> = [];
    const dynamicChunks = [];

    const createGraph = async (entry: string, isDynamic: boolean) => {
      const entryAsset = await this.getOrCreateAsset(entry, {
        async: isDynamic,
      });

      const queue = [entryAsset];
      for (const asset of queue) {
        for (const dependency of asset.dependencies) {
          const id = asset.mapping[dependency.path];
          if (dependency.async) {
            dynamicChunks.push(id);
          } else {
            const dependencyAsset = await this.getOrCreateAsset(id);
            queue.push(dependencyAsset);
          }
        }
      }
      return queue;
    };

    graphs.push(await createGraph(entry, false));
    for (const chunk of dynamicChunks) {
      graphs.push(await createGraph(chunk, true));
    }
    return graphs;
  }

  generateModules(graph: IGraph) {
    return graph.map((asset) => this.generateModule(asset)).join("\n");
  }

  generateModule(asset: IAsset) {
    return `"${asset.id}": [
        function (require, module, exports) {
          ${asset.code}
        },
        ${JSON.stringify(asset.mapping)},
      ],`;
  }

  bundleInitialChunk = (graph: IGraph) => {
    const modules = this.generateModules(graph);
    const events = `
      var __webpack_events__ = new class {
        constructor() {
          this.map = {};
        }

        on(type, callback) {
          this.map[type] = this.map[type] || [];
          let fns = this.map[type];
          if (!fns.includes(callback)) {
            fns.push(callback);
          }
          return this;
        }

        emit(type, ...data) {
          let fns = this.map[type];
          if (fns) {
            fns.forEach((fn) => fn(...data))
          }
          return this;
        }

        off(type, callback) {
          let fns = this.map[type];
          if (fns) {
            this.map[type] = fns.filter((fn) => fn !== callback);
          } else {
            throw new Error(\`Have not '\${type}' event\`);
          }
          return this;
        }

        isEmpty(type) {
          return !this.map[type] || this.map[type].length === 0;
        }
      }();
    `;
    const hmr = `
      var __webpack_socket__ = new window.WebSocket("ws://localhost:${this.config.port}");
      __webpack_socket__.onmessage = function (event) {
        var data = JSON.parse(event.data);
        if (data.type === "reload") window.location.reload();
        else if (data.type === "change") {
          const script = document.createElement('script');
          script.src = "./hot-update.js";
          script.onload = function () {
            if (__webpack_events__.isEmpty(data.id)) {
              window.location.reload();
            } else {
              __webpack_events__.emit(data.id);
            }
          }
          document.body.appendChild(script);
        };
      };
    `;
    const requireModule = `
      var __webpack_require__ = (chunk_id) => {
        function require(id) {
          const [fn, mapping] = __webpack_modules__[id];

          function localRequire(name) {
            return require(mapping[name]);
          }

          const module = { exports: {}, hot: {} };
          module.hot.accept = function (name, callback) {
            const id = mapping[name];
            if (__webpack_events__.isEmpty(id)) {
              __webpack_events__.on(id, callback);
            }
          };

          fn(localRequire, module, module.exports);

          return module.exports;
        }
        return require(chunk_id);
      };
      var __webpack_modules__ = {${modules}};
      __webpack_require__("${this.config.entry}");
    `;

    return this.config.port ? events + hmr + requireModule : requireModule;
  };

  bundleNonInitialChunk(graph: IGraph) {
    const modules = this.generateModules(graph);
    const result = `
    __webpack_modules__ = {...__webpack_modules__, ${modules}}
    export default __webpack_require__("${graph[0].id}");
  `;
    return result;
  }

  async bundleUpdateChunk(asset: IAsset) {
    const module = this.generateModule(asset);
    const result = `
    __webpack_modules__ = {...__webpack_modules__, ${module}}
  `;
    return result;
  }

  async update(updateEntry: string) {
    const { output } = this.config;
    const asset = await this.createAsset(updateEntry);
    const updateChunk = await this.bundleUpdateChunk(asset);
    await fsp.writeFile(path.join(output, "hot-update.js"), updateChunk);
  }

  async build() {
    const { entry, output, filename } = this.config;
    const graphs = await this.createGraphs(entry);
    const initialBundle = this.bundleInitialChunk(graphs[0]);
    await fsp.writeFile(path.join(output, filename), initialBundle);
    const promises = graphs.slice(1).map(async (graph) => {
      const name = graph[0].id.replace(/\//g, "-");
      await fsp.writeFile(
        path.join(output, name),
        this.bundleNonInitialChunk(graph)
      );
    });
    await Promise.all(promises);
  }

  async rebuild(id: string) {
    this.assetMap.delete(id);
    await this.build();
  }
}
export default Bundler;
