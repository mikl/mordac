import * as cheerio from 'cheerio'

const protocolRelativePrefixMatcher = /^\/\//

export interface IParserExtractedValues {
  largeImage?: IParserExtractedImage
}

export interface IParserExtractedImage {
  title: string
  url: string
}

/**
 * Parse the Dilbert.com markup, and locate the data we need.
 */
export async function parser(
  date: string,
  markup: string
): Promise<IParserExtractedValues> {
  const extractedValues: IParserExtractedValues = {}

  const $ = cheerio.load(markup)

  const img = $('.comic-item-container .img-comic')

  extractedValues.largeImage = {
    title: img.attr('alt'),
    url: img.attr('src').replace(protocolRelativePrefixMatcher, 'https://')
  }

  if (!extractedValues.largeImage.title || !extractedValues.largeImage.url) {
    throw new Error(`Failed to extract image for date: ${date}`)
  }

  return extractedValues
}
