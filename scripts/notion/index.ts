import { fetchNotionData, readNotionEnvironment, redactNotionSecrets } from './source.ts'
import { readPreviousPages, replaceNotionSnapshot } from './snapshot.ts'

async function main(): Promise<void> {
  const previousPages = await readPreviousPages()
  const data = await fetchNotionData(readNotionEnvironment(), previousPages)
  await replaceNotionSnapshot(data)
  console.log(
    `Notion Data ready: ${data.pages.size} Published pages (${data.reusedPages} unchanged) and ${data.config.configRows.length} Config rows.`,
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(redactNotionSecrets(message))
  process.exitCode = 1
})