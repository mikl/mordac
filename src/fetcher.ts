// Fetcher, gets the HTML page and returns the wanted data.
import { addDays, format, isAfter, subDays } from 'date-fns'
import * as levelup from 'level'
import fetch from 'node-fetch'
import * as path from 'path'
import * as winston from 'winston'

import { IParserExtractedValues, parser } from './parser'

export interface IFetcherValues {
  [propName: string]: IParserExtractedValues
}

export class Fetcher {
  protected db: any
  protected startPoint: Date
  protected position: Date
  protected values: IFetcherValues = {}

  constructor(startFrom: Date, dayCount: number) {
    // Database to keep track of already fetched content.
    // The keys are the date, and the value is the data structure returned
    // by the parser. LevelUP transparently translates it to and from JSON.
    this.db = levelup(path.resolve('./mordac.db'), {
      valueEncoding: 'json'
    })

    // Save the point we started from.
    this.startPoint = startFrom

    // Keep track of where we are now.
    this.position = subDays(this.startPoint, dayCount)
  }

  // Get data for a specific date.
  public async fetchDate(date: string): Promise<IParserExtractedValues> {
    let value: IParserExtractedValues
    // First, try getting it from the database.
    try {
      value = await this.db.get(date)
    } catch (err) {
      if (err.notFound) {
        value = {}
      } else {
        throw err
      }
    }

    // If we do not have data for this date yet, fetch the markup,
    // parse it and store the output.
    if (!value || !value.largeImage || !value.largeImage.url) {
      const markup = await this.fetchMarkup(date)

      // The parser takes the date and markup returned by fetchMarkup.
      const parsedValues = await parser(date, markup)

      // Save the extracted data before proceeding.
      await this.db.put(date, parsedValues)
    }

    return value
  }

  // Fetch markup for a specific date.
  public async fetchMarkup(date: string): Promise<string> {
    const URL = `https://dilbert.com/strip/${date}`

    winston.info('Fetching ' + URL)

    const response = await fetch(URL)
    const body = await response.text()

    return body
  }

  public async run(): Promise<IFetcherValues> {
    while (!isAfter(this.position, this.startPoint)) {
      const date = format(this.position, 'YYYY-MM-DD')
      const values = await this.fetchDate(date)

      if (values) {
        this.values[date] = values
      }

      // Subtract a day so we move on to the previous one.
      this.position = addDays(this.position, 1)
    }

    return this.values
  }
}
