const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.md', '.markdown']

function validateMarkdownFile(file) {
  if (!(file instanceof File)) {
    throw new Error('No readable file was provided.')
  }

  const dotIndex = file.name.lastIndexOf('.')
  const extension = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : ''

  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error('Only Markdown (.md or .markdown) files are supported. The selected file appears to use a different format.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('This Markdown file is larger than 10 MB. Please upload a smaller file.')
  }
}

export async function readMarkdownFile(file) {
  validateMarkdownFile(file)

  try {
    return {
      name: file.name,
      content: await file.text(),
    }
  } catch {
    throw new Error('We could not read this file. Please try uploading it again.')
  }
}
