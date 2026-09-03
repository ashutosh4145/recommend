export function ProductCard({ product, highlighted = false }) {
  return (
    <article className={`card${highlighted ? " card--highlighted" : ""}`}>
      <div className="card__top">
        <span className="card__sku">SKU {String(product.id).padStart(3, "0")}</span>
        <span className="card__category">{product.category}</span>
      </div>
      <h3 className="card__name">{product.name}</h3>
      <p className="card__desc">{product.description}</p>
      <div className="card__bottom">
        <span className="card__price">${product.price}</span>
        {highlighted && <span className="card__badge">Recommended</span>}
      </div>
    </article>
  );
}

export function ProductList({ products, title }) {
  return (
    <section className="list-section">
      {title && <h2 className="list-section__title">{title}</h2>}
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function RecommendedSection({ products, status, error }) {
  if (status === "idle") return null;

  return (
    <section className="list-section list-section--recommended">
      <h2 className="list-section__title">Recommended for you</h2>

      {status === "loading" && (
        <p className="status status--loading">Thinking…</p>
      )}

      {status === "error" && (
        <p className="status status--error">
          {error || "Something went wrong. Please try again."}
        </p>
      )}

      {status === "success" && products.length === 0 && (
        <p className="status">No close matches found. Try rephrasing your request.</p>
      )}

      {status === "success" && products.length > 0 && (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} highlighted />
          ))}
        </div>
      )}
    </section>
  );
}

export function RecommendationInput({ value, onChange, onSubmit, loading }) {
  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSubmit();
  }

  return (
    <form className="ask" onSubmit={handleSubmit}>
      <label className="ask__label" htmlFor="ask-input">
        What are you shopping for?
      </label>
      <div className="ask__row">
        <input
          id="ask-input"
          className="ask__input"
          type="text"
          placeholder="e.g. I want a phone under $500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className="ask__button" type="submit" disabled={loading || !value.trim()}>
          {loading ? "Thinking…" : "Get Recommendations"}
        </button>
      </div>
    </form>
  );
}
