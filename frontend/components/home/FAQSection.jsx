import Container from '@/components/common/Container'
import SectionHeading from '@/components/common/SectionHeading'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: 'What is a bank e-auction?',
    a: 'A bank e-auction is an online public auction conducted by banks to sell properties that have been pledged as collateral for loans that have turned into Non-Performing Assets (NPAs). Buyers can bid transparently and acquire these assets, often below market value.',
  },
  {
    q: 'Who can participate as a bidder?',
    a: 'Any individual or registered entity that completes the KYC verification and deposits the required Earnest Money Deposit (EMD) can register as a bidder for a specific auction.',
  },
  {
    q: 'What is an EMD (Earnest Money Deposit)?',
    a: 'The EMD is a refundable security deposit (typically 10% of the reserve price) that a bidder must pay before participating in an auction. It is refunded to unsuccessful bidders after the auction concludes.',
  },
  {
    q: 'Are the property titles verified?',
    a: 'Yes. All listed properties are backed by banks, and the title documents are verified by the respective lending institution before the property is put up for auction.',
  },
  {
    q: 'How is BidAcres different from individual bank portals?',
    a: 'BidAcres aggregates auction listings from multiple banks and financial institutions onto a single platform, so you can search, compare and track opportunities across the country without visiting each bank portal separately.',
  },
  {
    q: 'What is the difference between physical and symbolic possession?',
    a: 'Physical possession means the bank has taken actual control of the property, whereas symbolic possession means the bank has legal possession but the property may still be occupied. This affects how soon you can take over the asset.',
  },
]

export default function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-24 bg-navy-50/70 py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Need Help?"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know before participating in a bank e-auction."
        />
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-2">
          {faqs.map((faq, i) => (
            <Accordion key={i} type="single" collapsible>
              <AccordionItem value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </Container>
    </section>
  )
}
