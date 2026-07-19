import Link from "next/link";

export default function SetupGuideLink({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      Need help setting up?{" "}
      <Link
        href="/resources/basics/setting-up-your-ai-provider"
        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        View the setup guide
      </Link>{" "}
      for Ollama or BYOK to get started in just a few minutes.
    </p>
  );
}
