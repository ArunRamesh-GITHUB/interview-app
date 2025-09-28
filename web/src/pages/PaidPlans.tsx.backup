
import React from "react";

const plans = [
  { id: "starter", price: "£6.99", tokens: 120, blurb: "Good for light weekly practice." },
  { id: "plus",    price: "£12.99", tokens: 250, blurb: "More practice + exports." },
  { id: "pro",     price: "£29.99", tokens: 480, blurb: "Daily feel. Mix practice & realtime." },
  { id: "power",   price: "£44.99", tokens: 1000, blurb: "Heavy users & mock interviews." },
];

const tokenExplainer = [
  "1 token = 1 minute of Practice (non-Realtime voice).",
  "Realtime uses 9 tokens per minute.",
  "Practice rounds to 15s (0.25 token). Realtime rounds to 10s (1.5 tokens).",
  "Each Realtime session has a 5-token minimum.",
  "Typed answers: 1 token per scored answer.",
];

export default function PaidPlans() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Choose your plan</h1>
      <p className="text-gray-600 mb-8">
        Tokens let you mix Practice and Realtime however you like.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(p => (
          <div key={p.id} className="rounded-2xl border p-6 shadow-sm flex flex-col">
            <div className="text-xl font-semibold capitalize">{p.id}</div>
            <div className="text-3xl font-bold mt-2">{p.price}<span className="text-base font-medium text-gray-500">/mo</span></div>
            <div className="mt-2 text-sm text-gray-600">{p.blurb}</div>
            <div className="mt-4 text-2xl font-semibold">{p.tokens} tokens</div>
            <button
              className="mt-auto w-full rounded-xl bg-black text-white py-2.5 hover:opacity-90"
              onClick={() => alert(`TODO: start checkout for ${p.id}`)}
            >
              Continue
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-3">How tokens work</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          {tokenExplainer.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
        <div className="mt-4 text-sm text-gray-500">
          Pay in-app (App Store / Play) or on the web. Prices may vary by platform.
        </div>
      </div>
    </div>
  );
}
