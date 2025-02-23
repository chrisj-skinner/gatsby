import { readFileSync } from "fs-extra"
import { parse } from "node-html-parser"
import { page, data } from "../shared-data/head-function-export.js"

/**
 * This test ensures that the head elements actually end up in the SSR'ed HTML.
 *
 * The production-runtime e2e test does the same but in the browser, and we want to make sure
 * that we're not being tricked by the browser runtime inserting head elements.
 */

const publicDir = `${__dirname}/../public`

function getNodes(dom) {
  const base = dom.querySelector(`[data-testid=base]`)
  const title = dom.querySelector(`[data-testid=title]`)
  const meta = dom.querySelector(`[data-testid=meta]`)
  const noscript = dom.querySelector(`[data-testid=noscript]`)
  const style = dom.querySelector(`[data-testid=style]`)
  const link = dom.querySelector(`[data-testid=link]`)
  const jsonLD = dom.querySelector(`[data-testid=jsonLD]`)
  return { base, title, meta, noscript, style, link, jsonLD }
}

describe(`Head function export SSR'ed HTML output`, () => {
  it(`should work with static data`, () => {
    const html = readFileSync(`${publicDir}${page.basic}/index.html`)
    const dom = parse(html)
    const { base, title, meta, noscript, style, link, jsonLD } = getNodes(dom)

    expect(base.attributes.href).toEqual(data.static.base)
    expect(title.text).toEqual(data.static.title)
    expect(meta.attributes.content).toEqual(data.static.meta)
    expect(noscript.text).toEqual(data.static.noscript)
    expect(style.text).toContain(data.static.style)
    expect(link.attributes.href).toEqual(data.static.link)
    expect(jsonLD.innerHTML).toEqual(data.static.jsonLD)
  })

  it(`should work with data from a page query`, () => {
    const html = readFileSync(`${publicDir}${page.pageQuery}/index.html`)
    const dom = parse(html)
    const { base, title, meta, noscript, style, link } = getNodes(dom)

    expect(base.attributes.href).toEqual(data.queried.base)
    expect(title.text).toEqual(data.queried.title)
    expect(meta.attributes.content).toEqual(data.queried.meta)
    expect(noscript.text).toEqual(data.queried.noscript)
    expect(style.text).toContain(data.queried.style)
    expect(link.attributes.href).toEqual(data.queried.link)
  })

  it(`should work when a Head function with static data is re-exported from the page`, () => {
    const html = readFileSync(`${publicDir}${page.reExport}/index.html`)
    const dom = parse(html)
    const { base, title, meta, noscript, style, link, jsonLD } = getNodes(dom)

    expect(base.attributes.href).toEqual(data.static.base)
    expect(title.text).toEqual(data.static.title)
    expect(meta.attributes.content).toEqual(data.static.meta)
    expect(noscript.text).toEqual(data.static.noscript)
    expect(style.text).toContain(data.static.style)
    expect(link.attributes.href).toEqual(data.static.link)
    expect(jsonLD.text).toEqual(data.static.jsonLD)
  })

  it(`should work when an imported Head component with queried data is used`, () => {
    const html = readFileSync(`${publicDir}${page.staticQuery}/index.html`)
    const dom = parse(html)
    const { base, title, meta, noscript, style, link } = getNodes(dom)

    expect(base.attributes.href).toEqual(data.queried.base)
    expect(title.text).toEqual(data.queried.title)
    expect(meta.attributes.content).toEqual(data.queried.meta)
    expect(noscript.text).toEqual(data.queried.noscript)
    expect(style.text).toContain(data.queried.style)
    expect(link.attributes.href).toEqual(data.queried.link)
  })

  it(`deduplicates multiple tags with same id`, () => {
    const html = readFileSync(`${publicDir}${page.deduplication}/index.html`)
    const dom = parse(html)

    // deduplication link has id and should be deduplicated
    expect(dom.querySelectorAll(`link[rel=deduplication]`)?.length).toEqual(1)
    // last deduplication link should win
    expect(
      dom.querySelector(`link[rel=deduplication]`)?.attributes?.href
    ).toEqual("/bar")
    // we should preserve id
    expect(
      dom.querySelector(`link[rel=deduplication]`)?.attributes?.id
    ).toEqual("deduplication-test")

    // alternate links are not using id, so should have multiple instances
    expect(dom.querySelectorAll(`link[rel=alternate]`)?.length).toEqual(2)
  })
})
