import pdf from "pdf-parse-new"
import fs from 'fs'
import { chunk } from 'llm-chunk'

pdf(fs.readFileSync('sample.pdf'))
  .then(async data => console.log(chunk(data.text, { splitter: "paragraph" })))
