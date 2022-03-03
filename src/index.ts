import { Context, Dict, hyphenate, Schema, segment } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/plugin-puppeteer'

export const name = 'EvalReactJSX'
export const using = ['worker', 'puppeteer'] as const

export interface Config {
  bodyStyle?: Dict<string>
}

export const Config = Schema.object({
  bodyStyle: Schema.dict(Schema.string()).default({
    display: 'inline-block',
    padding: '0.25rem 0.375rem',
  }),
})

export function apply(ctx: Context, config: Config) {
  ctx.worker.config.loaderConfig.jsxFactory = 'jsxFactory'
  ctx.worker.config.loaderConfig.jsxFragment = 'jsxFragment'
  ctx.worker.config.setupFiles['puppeteer.ts'] = resolve(__dirname, 'worker')

  ctx.before('eval/send', (content) => {
    return segment.transformAsync(content, {
      async fragment({ content }) {
        const style = Object
          .entries(config.bodyStyle)
          .map(([key, value]) => `${hyphenate(key)}: ${value};`)
          .join('')
        return await ctx.puppeteer.render(`<!doctype html>
          <html><body style="${style}">${content}</body></html>
        `, async (page, next) => next(await page.$('body')))
      },
    })
  })
}
