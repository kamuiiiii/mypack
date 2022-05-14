import printMe from "./print.js";
import name from "./name.js";

function component() {
  import("./foo/name.js").then((module) => {
    console.log("Dynamic import './foo/name.js'", module.default);
  });

  const element = document.createElement("div");
  const btn = document.createElement("button");

  element.innerHTML = `Hello ${name}!`;

  btn.innerHTML = "Click me and check the console!";
  btn.onclick = printMe; // onclick event is bind to the original printMe function

  element.appendChild(btn);

  return element;
}

let element = component(); // Store the element to re-render on print.js changes
document.body.appendChild(element);

if (module.hot) {
  module.hot.accept("./print.js", function () {
    console.log("Accepting the updated './print.js' !");
    document.body.removeChild(element);
    element = component();
    document.body.appendChild(element);
  });

  module.hot.accept("./name.js", function () {
    console.log("Accepting the updated './name.js' !");
    console.log(name);
  });

  module.hot.accept("./foo/name.js", function () {
    console.log("Accepting the updated './foo/name,js' !");
    console.log(name2);
  });
}
