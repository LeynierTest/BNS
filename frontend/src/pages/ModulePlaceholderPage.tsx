type ModulePlaceholderPageProps = {
  title: string;
  eyebrow: string;
  description: string;
};

export function ModulePlaceholderPage({
  title,
  eyebrow,
  description,
}: ModulePlaceholderPageProps) {
  return (
    <section className="placeholder-page">
      <span className="dashboard-eyebrow">
        {eyebrow}
      </span>

      <h2>{title}</h2>

      <p>{description}</p>
    </section>
  );
}
