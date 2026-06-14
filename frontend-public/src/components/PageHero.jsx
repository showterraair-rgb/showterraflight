export default function PageHero({ title, subtitle, children }) {
  return (
    <section className="bg-gradient-to-br from-brand-700 to-brand-800 text-white">
      <div className="container-page py-16 md:py-20">
        <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-brand-100">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
