import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'

export function headingNodeText(node) {
  if (typeof node.value === 'string') return node.value
  if (!Array.isArray(node.children)) return ''
  return node.children.map(headingNodeText).join('')
}

export function slugifyHeading(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'section'
}

export function extractHeadings(markdown) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown)
  const headings = []
  const counts = new Map()

  visit(tree, 'heading', (node) => {
    const text = headingNodeText(node).trim()
    if (!text) return

    const baseId = slugifyHeading(text)
    const occurrence = counts.get(baseId) || 0
    counts.set(baseId, occurrence + 1)
    headings.push({
      text,
      level: node.depth,
      id: occurrence ? `${baseId}-${occurrence}` : baseId,
    })
  })

  return headings
}

export function remarkHeadingIds() {
  return (tree) => {
    const counts = new Map()

    visit(tree, 'heading', (node) => {
      const text = headingNodeText(node).trim()
      if (!text) return

      const baseId = slugifyHeading(text)
      const occurrence = counts.get(baseId) || 0
      counts.set(baseId, occurrence + 1)
      const id = occurrence ? `${baseId}-${occurrence}` : baseId
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
    })
  }
}

export function buildHeadingTree(headings) {
  const roots = []
  const stack = []

  headings.forEach((heading) => {
    const item = { ...heading, children: [] }
    while (stack.length && stack.at(-1).level >= item.level) stack.pop()

    if (stack.length) stack.at(-1).children.push(item)
    else roots.push(item)

    stack.push(item)
  })

  return roots
}
