import MarketingNav from "@/components/MarketingNav";
import ContactForm from "@/components/ContactForm";

export default function Contact() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60 dark:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at 15% 10%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(600px circle at 85% 30%, rgba(217,70,239,0.10), transparent 60%)",
        }}
      />

      <MarketingNav />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2 lg:items-start">
        <div>
          <h1 className="bg-gradient-to-r from-gray-900 via-indigo-600 to-fuchsia-600 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-5xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
            How can we help?
          </h1>
          <p className="mt-5 max-w-md text-lg text-gray-600 dark:text-slate-400">
            Speak to our team about plans, pricing, self-hosting your own
            instance, or request a demo.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tell us how we can help
          </h2>

          <ContactForm />
        </div>
      </div>

      <footer className="border-t border-gray-200 px-6 py-8 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row dark:text-slate-500">
          <span>© {new Date().getFullYear()} Cognexa. Self-hosted RAG platform. </span>
        </div>
      </footer>
    </main>
  );
}
