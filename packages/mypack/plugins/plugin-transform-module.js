const tempalte = require("@babel/template").default;

function plugin({ types: t }) {
  const astMap = new Map();

  const unshiftReloadModuleAst = (accept) => {
    const arguments = accept.expression.arguments;
    const source = arguments[0].value;
    const ast = astMap.get(source);
    if (ast) {
      arguments[1].body.body.unshift(ast);
    }
  };

  const visitor = {
    ImportDeclaration(path) {
      const name = path.node.specifiers[0].local.name;
      const source = path.node.source.value;
      const newName =
        source.split(/\.\//)[1].replace(/[/.]/g, "_") +
        "_WEBPACK_IMPORTED_MODULE";
      path.scope.rename(name, newName);
      const updateAst = tempalte.ast(`${newName} = require("${source}");`);
      astMap.set(source, updateAst);
      const ast = tempalte.ast(`var ${newName} = require("${source}");`);
      path.replaceWith(ast);
    },
    ExportDeclaration(path) {
      const source = path.node.declaration.name;
      const ast = tempalte.ast(`module.exports = ${source};`);
      path.replaceWith(ast);
    },
    IfStatement(path) {
      if (t.isMemberExpression(path.node.test)) {
        const { object, property } = path.node.test;
        if (
          t.isIdentifier(object, { name: "module" }) &&
          t.isIdentifier(property, { name: "hot" })
        ) {
          path.node.test = t.booleanLiteral(true);
          const accepts = path.get("consequent").node.body;
          accepts.forEach(unshiftReloadModuleAst);
        }
      }
    },
  };
  return { visitor };
}

module.exports = plugin;
