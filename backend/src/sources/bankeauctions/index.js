import { config } from '../../config/env.js'
import { runIngest } from './ingest.js'

/** Source adapter for bankeauctions.com (C1 India). */
export default {
  source: 'bankeauctions',
  label: 'BankeAuctions',
  get enabled() {
    return config.sources.bankeauctions.enabled
  },
  run: (options) => runIngest(options),
}
