import SiteHeader from "@/components/SiteHeader";
import NewStoryForm from "@/components/NewStoryForm";

export default function NewStoryPage() {
  return (
    <>
      <SiteHeader right={<span className="text-sm text-ink/50">New story</span>} />
      <main className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        <NewStoryForm />
      </main>
    </>
  );
}
