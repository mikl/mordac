// Generates the Atom feed and write it to disk.

import * as ATOMWriter from 'atom-writer'
import * as fs from 'fs'
import * as path from 'path'
import * as XMLWriter from 'xml-writer'

import { IFetcherValues } from './fetcher'
import { IParserExtractedImage, IParserExtractedValues } from './parser'

const outputDir = path.resolve('public')

// Create the output dir when this file is loaded.
fs.mkdir(outputDir, (err) => {
  // If exists already, fail silently.
  if (err && err.code === 'EEXIST') {
    return
  } else {
    throw err
  }
})

// Generate HTML fragment for image.
function htmlImageFragment(image: IParserExtractedImage): string {
  const xw = new XMLWriter()

  xw.startElement('div')
  xw.startElement('img')
  xw.writeAttribute('src', image.url)

  if (image.title) {
    xw.writeAttribute('alt', image.title)
    xw.writeAttribute('title', image.title)
  }

  return xw.toString()
}

export async function generator(values: IFetcherValues) {
  const baseURN = 'urn:mordac:feed:'
  const xw = new XMLWriter(true)
  const aw = new ATOMWriter(xw)

  // Generate a full, standalone, XML document.
  xw.startDocument('1.0', 'utf-8')

  // Generate the feed header.
  aw
    .startFeed(baseURN + 'atom.xml')
    .writeTitle('Mordac’s RSS feed')
    .writeAuthor('Scott Adams')
    .writeContributor('Mordac the Preventer of Information Services')

  // Generate an entry for each value.
  for (const day of Object.keys(values)) {
    // Generate a fake timestamp for each post, so feed readers do not
    // consider them new/updated accidentally.
    const date = new Date(day + 'T13:37:00Z')

    const value: IParserExtractedValues = values[day]

    if (value && value.largeImage && value.largeImage.url) {
      aw
        .startEntry(baseURN + 'entry:' + day, date, date)
        .writeContent(htmlImageFragment(value.largeImage), 'html')

      if (value.largeImage.title) {
        aw.writeTitle(value.largeImage.title)
      }

      aw.endEntry()
    }
  }

  aw.endFeed()
  xw.endDocument()

  await fs.promises.writeFile(outputDir + '/atom.xml', xw.toString())
}
