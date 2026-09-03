import { useState } from "react";
import products from "./products.js";
import { fetchRecommendations } from "./api.js";
import { ProductList, RecommendationInput, RecommendedSection } from "./components.jsx";

export default function App() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [recommended, setRecommended] = useState([]);
  const [error, setError] = useState("");

  async function handleGetRecommendations() {
    setStatus("loading");
    setError("");
    try {
      const ids = await fetchRecommendations(query, products);
      const matches = products.filter((p) => ids.includes(p.id));
      setRecommended(matches);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <p className="masthead__eyebrow">The Catalog</p>
        <h1 className="masthead__title">Find the right gear, faster</h1>
        <p className="masthead__sub">
          Browse the full lineup below, or describe what you need and let the
          catalog point you to the closest matches.
        </p>
      </header>

      <RecommendationInput
        value={query}
        onChange={setQuery}
        onSubmit={handleGetRecommendations}
        loading={status === "loading"}
      />

      <RecommendedSection products={recommended} status={status} error={error} />

      <ProductList products={products} title="Full catalog" />

      <footer className="footer">14 items · prices in USD</footer>
    </div>
  );
}
