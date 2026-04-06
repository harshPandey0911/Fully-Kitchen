export default function ProductsHeader({ onRegister }) {
  return (
    <section className="rounded-[24px] bg-white p-4 !shadow-[0_14px_34px_rgba(30,30,30,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.2rem] font-bold tracking-[-0.03em] text-[#1E1E1E]">My Products</h1>
          <p className="mt-1 text-sm leading-6 text-[#6B6B6B]">
            Track registered appliances and browse new retailer inventory in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onRegister}
          className="flex-none rounded-xl bg-[#8B5E3C] px-3.5 py-2.5 text-[12px] font-semibold text-white !shadow-[0_10px_24px_rgba(139,94,60,0.24)] transition-all duration-300 ease-out active:scale-95"
        >
          Register Product
        </button>
      </div>
    </section>
  );
}
