import * as cheerio from 'cheerio'
import { config } from '../../config/env.js'
import { cleanText } from '../../utils/format.js'

const stripLabel = (s) => cleanText(s).replace(/\s*:\s*$/, '').trim()

function classifyDoc(label, href) {
  const l = (label || '').toLowerCase()
  if (/annexure/.test(l)) return 'annexure'
  if (/tender/.test(l)) return 'tender'
  if (/sale|notice|nit/.test(l)) return 'sale_notice'
  if (/corrigend/.test(l)) return 'corrigendum'
  return 'other'
}

/**
 * Fetch and parse a bankeauctions.com property detail page.
 *
 * The page is server-rendered as a series of `.detl-inner` sections, each a set
 * of `.row` > (`.detl-left` label, `.detl-right` value|download-link) pairs.
 * Returns a labelled field map plus any attached documents (PDFs/zip), or null
 * if the page could not be fetched.
 */
export async function fetchDetail(client, card) {
  const { detailPath } = await import('./listing.js')
  const path = detailPath(card)
  let html
  try {
    html = await client.get(path)
  } catch (err) {
    if (err.code === 'NOT_FOUND') return null
    throw err
  }
  if (typeof html !== 'string') return null

  const $ = cheerio.load(html)
  const fields = {}
  const documents = []

  $('.detl-inner .row').each((_, row) => {
    const left = $(row).find('.detl-left').first()
    const right = $(row).find('.detl-right').first()
    if (!left.length || !right.length) return
    const label = stripLabel(left.text())
    if (!label) return

    const links = right.find('a[href]')
    if (links.length) {
      links.each((__, a) => {
        const href = $(a).attr('href')
        if (!href || /^javascript:|^#/.test(href)) return
        const url = href.startsWith('http') ? href : `${config.bankeauctions.origin}${href.startsWith('/') ? '' : '/'}${href}`
        documents.push({ label, url, docType: classifyDoc(label, href) })
      })
    } else {
      const value = cleanText(right.text())
      if (value && value !== '--' && !/^not available$/i.test(value)) fields[label] = value
    }
  })

  return { fields, documents, sourcePath: path }
}

export default fetchDetail
