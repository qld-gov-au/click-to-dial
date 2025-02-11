mimport globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */

export default  [
  { files: ["**/*.js"], languageOptions: {sourceType: "commonjs"} },
  { languageOptions: { globals: {...globals.browser, ...globals.node} }},
  { languageOptions: { parserOptions: { ecmaVersion: "latest"} } },
  pluginJs.configs.recommended,
  { rules: { "eqeqeq" : "error", "max-len": ["error", 80] }}
]





