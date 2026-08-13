const SEARCH_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, td, th, pre'

export function clearSearchHighlights(root) {
  if (!root) return
  root.querySelectorAll('mark[data-search-match]').forEach((mark) => mark.replaceWith(mark.textContent))
  root.normalize()
}

function breadcrumbFor(node, headings) {
  const trail = []
  headings.forEach((heading) => {
    const position = heading.compareDocumentPosition(node)
    if (!(position & Node.DOCUMENT_POSITION_FOLLOWING) && !heading.contains(node)) return
    const level = Number(heading.tagName.slice(1))
    trail.splice(level - 1)
    trail[level - 1] = heading.textContent.trim()
  })
  return trail.filter(Boolean).join(' → ')
}

function contextFor(node) {
  const block = node.parentElement?.closest(SEARCH_SELECTOR)
  return (block?.textContent || node.textContent || '').replace(/\s+/g, ' ').trim()
}

export function searchDocument(root, query) {
  clearSearchHighlights(root)
  const term = query.trim()
  if (!root || term.length < 2) return []

  const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')]
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.trim() || node.parentElement?.closest('mark[data-search-match]')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)

  const results = []
  const lowerTerm = term.toLocaleLowerCase()

  textNodes.forEach((textNode) => {
    const value = textNode.textContent
    const lowerValue = value.toLocaleLowerCase()
    let cursor = 0
    let matchIndex = lowerValue.indexOf(lowerTerm)
    if (matchIndex < 0) return

    const fragment = document.createDocumentFragment()
    while (matchIndex >= 0) {
      fragment.append(value.slice(cursor, matchIndex))
      const mark = document.createElement('mark')
      mark.dataset.searchMatch = 'true'
      mark.textContent = value.slice(matchIndex, matchIndex + term.length)
      fragment.append(mark)
      results.push({
        element: mark,
        breadcrumb: breadcrumbFor(textNode, headings),
        context: contextFor(textNode),
      })
      cursor = matchIndex + term.length
      matchIndex = lowerValue.indexOf(lowerTerm, cursor)
    }
    fragment.append(value.slice(cursor))
    textNode.replaceWith(fragment)
  })

  return results
}
