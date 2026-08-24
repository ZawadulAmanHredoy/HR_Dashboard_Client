import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { HelpIcon, SparkIcon, VideoIcon } from "@/components/icons";
import { usePageTitle } from "@/hooks/useApi";

const topics = [
  {
    icon: SparkIcon,
    title: "Getting started",
    body: "Set up your consultant profile, availability and pricing in under ten minutes.",
  },
  {
    icon: VideoIcon,
    title: "Running a consult",
    body: "Device checks, screen sharing and how to share documents during a live session.",
  },
  {
    icon: HelpIcon,
    title: "Payouts & billing",
    body: "When payouts run, how refunds work and where to download your invoices.",
  },
];

const faqs = [
  {
    q: "How do I block a day off?",
    a: "Open My Availability, switch to the Classic view, tap Mark Holidays and select the days you want closed.",
  },
  {
    q: "Can a client reschedule on their own?",
    a: "Yes. Clients can reschedule up to 12 hours before the session; you get a notification when they do.",
  },
  {
    q: "Where do uploaded CVs live?",
    a: "Every document a client uploads is attached to the appointment and reachable from View Documents.",
  },
  {
    q: "What happens if I miss a session?",
    a: "The booking is marked as missed and the client is offered a free reschedule within seven days.",
  },
];

export default function HelpPage() {
  usePageTitle("Help");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {topics.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <Icon width={18} height={18} />
            </span>
            <h2 className="mt-3.5 text-[14px] font-semibold text-ink-900">{title}</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{body}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Frequently asked"
          action={<Button variant="outline">Contact support</Button>}
        />
        <div className="divide-y divide-ink-100">
          {faqs.map((faq) => (
            <details key={faq.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[13.5px] font-medium text-ink-900">
                {faq.q}
                <span className="text-ink-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-ink-500">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
