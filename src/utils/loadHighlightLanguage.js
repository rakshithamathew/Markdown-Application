const languageModules = import.meta.glob('/node_modules/highlight.js/es/languages/*.js')

export async function loadHighlightLanguage(language) {
  const load = languageModules[`/node_modules/highlight.js/es/languages/${language}.js`]
  if (!load) return null
  const module = await load()
  return module.default
}
