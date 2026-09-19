import type { Metadata } from 'next'
import BlogPostView from '@/components/blog/BlogPostView'
import { getPostBySlug } from '@/lib/wordpress'

function stripHtml(html?: string) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
function clamp(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Glamperos Blog' }

  const title = stripHtml(post.title?.rendered)
  const desc = clamp(stripHtml(post.excerpt?.rendered), 160)
  const image = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  // Spanish counterpart (slug without the -en suffix)
  const altSlug = slug.endsWith('-en') ? slug.slice(0, -3) : slug

  return {
    title,
    description: desc,
    alternates: {
      canonical: `/en/blog/${slug}`,
      languages: { 'es': `/blog/${altSlug}`, 'en': `/en/blog/${slug}` },
    },
    robots: { index: true, follow: true },
    openGraph: { title, description: desc, type: 'article', locale: 'en_US', images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title, description: desc, images: image ? [image] : undefined },
  }
}

export default async function BlogPostEn({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BlogPostView slug={slug} lang="en" basePath="/en/blog" />
}
