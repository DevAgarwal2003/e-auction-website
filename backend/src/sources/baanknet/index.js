import { config } from '../../config/env.js'
import { runIngest } from '../../services/ingestService.js'

/**
 * Source adapter for baanknet.com (BAANKNET / PSB e-auction). The heavy lifting
 * still lives in services/ingestService.js and the baanknet/ modules; this
 * adapter just exposes them to the multi-source registry.
 */
export default {
  source: 'baanknet',
  label: 'BAANKNET',
  get enabled() {
    return config.sources.baanknet.enabled
  },
  run: (options) => runIngest(options),
}
