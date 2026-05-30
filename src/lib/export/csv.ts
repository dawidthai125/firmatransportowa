/** @deprecated Użyj build*File z documents.ts + podgląd w aplikacji */
export {
  buildDailyReportsCsvFile as buildDailyReportsCsv,
  buildWeeklySummariesCsvFile as buildWeeklySummariesCsv,
  buildCoursesCsvFile as buildCoursesCsv,
  buildClientMarginsCsvFile as buildClientMarginsCsv,
} from '@/lib/export/documents'

export { triggerFileDownload as downloadPreviewableFile } from '@/lib/files/download'
