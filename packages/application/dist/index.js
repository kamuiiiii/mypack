
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
            throw new Error(`Have not '${type}' event`);
          }
          return this;
        }

        isEmpty(type) {
          return !this.map[type] || this.map[type].length === 0;
        }
      }();
    
      var __webpack_socket__ = new window.WebSocket("ws://localhost:3000");
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
      var __webpack_modules__ = {"src/index.js": [
        function (require, module, exports) {
          var print_js_WEBPACK_IMPORTED_MODULE = require("./print.js");

var name_js_WEBPACK_IMPORTED_MODULE = require("./name.js");

function component() {
  import("./src-foo-name.js").then(module => {
    console.log("Dynamic import './foo/name.js'", module.default);
  });
  const element = document.createElement("div");
  const btn = document.createElement("button");
  element.innerHTML = `Hello ${name_js_WEBPACK_IMPORTED_MODULE}!`;
  btn.innerHTML = "Click me and check the console!";
  btn.onclick = print_js_WEBPACK_IMPORTED_MODULE; // onclick event is bind to the original printMe function

  element.appendChild(btn);
  return element;
}

let element = component(); // Store the element to re-render on print.js changes

document.body.appendChild(element);

if (true) {
  module.hot.accept("./print.js", function () {
    print_js_WEBPACK_IMPORTED_MODULE = require("./print.js");
    console.log("Accepting the updated './print.js' !");
    document.body.removeChild(element);
    element = component();
    document.body.appendChild(element);
  });
  module.hot.accept("./name.js", function () {
    name_js_WEBPACK_IMPORTED_MODULE = require("./name.js");
    console.log("Accepting the updated './name.js' !");
    console.log(name_js_WEBPACK_IMPORTED_MODULE);
  });
  module.hot.accept("./foo/name.js", function () {
    console.log("Accepting the updated './foo/name,js' !");
    console.log(name2);
  });
}
        },
        {"./print.js":"src/print.js","./name.js":"src/name.js","./foo/name.js":"src/foo/name.js"},
      ],
"src/print.js": [
        function (require, module, exports) {
          const printMe = function () {
  console.log("Updating print.js...");
};

module.exports = printMe;
        },
        {},
      ],
"src/name.js": [
        function (require, module, exports) {
          const name = "kamui";
module.exports = name;
        },
        {},
      ],};
      __webpack_require__("src/index.js");
    