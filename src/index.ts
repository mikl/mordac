import { Fetcher } from './fetcher'
import { generator } from './generator'

async function run() {
  // Fetch up to the last 30 days of comics and run the feed generator.
  const iterator = new Fetcher(new Date(), 30)
  const values = await iterator.run()
  await generator(values)
}

// Basic use case, running this script directly.
if (require.main === module) {
  run()
}
