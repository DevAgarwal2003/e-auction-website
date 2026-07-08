import Hero from '@/components/home/Hero'
import StatsSection from '@/components/home/StatsSection'
import PartnerBanks from '@/components/home/PartnerBanks'
import CategorySection from '@/components/home/CategorySection'
import FeaturedAuctions from '@/components/home/FeaturedAuctions'
import HowItWorks from '@/components/home/HowItWorks'
import FAQSection from '@/components/home/FAQSection'
import CtaBanner from '@/components/home/CtaBanner'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <PartnerBanks />
      <CategorySection />
      <FeaturedAuctions />
      <HowItWorks />
      <FAQSection />
      <CtaBanner />
    </>
  )
}
