const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// AI / answer-engine crawlers we explicitly welcome (GEO): being cited by
// ChatGPT, Perplexity, Claude, Gemini, etc. is a discovery channel for us.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-Web',
  'Claude-SearchBot',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'Meta-ExternalAgent',
  'DuckAssistBot',
]

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Personal/client-only and non-content routes carry no SEO value.
        disallow: ['/saved', '/api/'],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: ['/saved'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
