const labelClass = 'mb-[6px] block text-sm font-medium text-[#6B4F3A]';
const inputClass = 'form-input !min-h-[52px] placeholder:!text-[#9CA3AF]';
const selectClass = 'form-select !min-h-[52px]';
const fileFieldClass = 'form-file-input';

export default function RegisterForm({
  form,
  productOptions,
  warrantyOptions,
  brandPlaceholder,
  onChange,
  onFileChange,
  onSubmit,
  onCancel,
}) {
  return (
    <section className="rounded-[24px] bg-white p-4 !shadow-[0_14px_34px_rgba(30,30,30,0.08)]">
      <div>
        <h2 className="text-[1rem] font-bold tracking-[-0.02em] text-[#1E1E1E]">Product details</h2>
        <p className="mt-1 text-sm leading-6 text-[#6B7280]">
          Add a few essentials to connect warranty coverage and invoice records.
        </p>
      </div>

      <form className="mt-5 space-y-[18px]" onSubmit={onSubmit}>
        <label className="block">
          <span className={labelClass}>Product Name</span>
          {productOptions.length > 0 ? (
            <select name="productName" value={form.productName} onChange={onChange} className={selectClass} required>
              {productOptions.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="productName"
              value={form.productName}
              onChange={onChange}
              className={inputClass}
              placeholder="Enter product name"
              required
            />
          )}
        </label>

        <label className="block">
          <span className={labelClass}>Brand</span>
          <input
            type="text"
            name="brand"
            value={form.brand}
            onChange={onChange}
            className={inputClass}
            placeholder={brandPlaceholder}
            required
          />
        </label>

        <label className="block">
          <span className={labelClass}>Purchase Date</span>
          <input
            type="date"
            name="purchaseDate"
            value={form.purchaseDate}
            onChange={onChange}
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className={labelClass}>Warranty Period</span>
          <select name="warrantyMonths" value={form.warrantyMonths} onChange={onChange} className={selectClass} required>
            {warrantyOptions.map((period) => (
              <option key={period} value={period}>
                {period} months
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Upload Invoice</span>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFileChange} className={fileFieldClass} />
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">
            {form.invoiceName ? `Selected file: ${form.invoiceName}` : 'Optional, but useful for faster warranty support.'}
          </p>
        </label>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 rounded-[18px] px-4 py-4 text-sm font-semibold text-white !shadow-[0_16px_30px_rgba(110,75,42,0.28)] transition-all duration-300 ease-out active:scale-95"
            style={{ background: 'linear-gradient(135deg, #A9745B, #6E4B2A)' }}
          >
            Register Product
          </button>

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[18px] bg-[#F4ECE7] px-4 py-4 text-sm font-semibold text-[#8B5E3C] transition-all duration-300 ease-out active:scale-95"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
