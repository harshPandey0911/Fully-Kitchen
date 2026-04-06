import { useMemo, useState } from 'react';
import { LuImage, LuPackage, LuWrench } from 'react-icons/lu';
import { getProductImage, serviceIssueTypes } from '../../../data/customerOwnership';

const labelClass = 'mb-[6px] block text-sm font-medium text-[#6B4F3A]';
const selectClass = 'form-select !min-h-[52px]';
const textareaClass = 'form-textarea !min-h-[100px] placeholder:!text-[#9CA3AF]';
const fileFieldClass = 'form-file-input';

const createInitialForm = (products) => ({
  productId: products[0]?.id || '',
  issueType: serviceIssueTypes[0],
  description: '',
  imageName: '',
  imageFile: null,
});

export default function ServiceRequestForm({ products, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => createInitialForm(products));

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) || products[0] || null,
    [form.productId, products],
  );
  const selectedProductImage = selectedProduct ? getProductImage(selectedProduct.productName) : '';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const imageFile = event.target.files?.[0] || null;
    const imageName = event.target.files?.[0]?.name || '';
    setForm((current) => ({ ...current, imageName, imageFile }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const currentProduct = products.find((product) => product.id === form.productId);

    if (!currentProduct) {
      return;
    }

    const didSubmit = await onSubmit({
      productId: currentProduct.id,
      productName: currentProduct.productName,
      issueType: form.issueType,
      description: form.description,
      imageName: form.imageName,
      imageFile: form.imageFile,
    });

    if (didSubmit !== false) {
      setForm(createInitialForm(products));
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] bg-white p-4 !shadow-[0_14px_34px_rgba(30,30,30,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-[18px] bg-[#FBF8F5]">
            {selectedProductImage ? (
              <img
                src={selectedProductImage}
                alt={selectedProduct?.productName || 'Selected product'}
                className="h-full w-full object-cover"
              />
            ) : (
              <LuPackage className="h-6 w-6 text-[#8B5E3C]" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A9745B]">Raise Service Request</p>
            <p className="mt-1 text-sm font-semibold text-[#1E1E1E]">{selectedProduct?.productName || 'Choose a product'}</p>
            <p className="mt-1 text-sm leading-6 text-[#6B7280]">Share the issue details so support can respond faster.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] bg-white p-4 !shadow-[0_14px_34px_rgba(30,30,30,0.08)]">
        <div>
          <h3 className="text-[1rem] font-bold tracking-[-0.02em] text-[#1E1E1E]">Request details</h3>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">Describe the problem clearly for a faster service response.</p>
        </div>

        <form className="mt-5 space-y-[18px]" onSubmit={handleSubmit}>
          <label className="block">
            <span className={labelClass}>Select Product</span>
            <select name="productId" value={form.productId} onChange={handleChange} className={selectClass} required>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName} / {product.brand}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Issue Type</span>
            <select name="issueType" value={form.issueType} onChange={handleChange} className={selectClass} required>
              {serviceIssueTypes.map((issueType) => (
                <option key={issueType} value={issueType}>
                  {issueType}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className={textareaClass}
              placeholder="Describe the issue clearly so the technician has enough context."
              required
            />
          </label>

          <label className="block">
            <span className={labelClass}>Upload Image</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className={fileFieldClass}
            />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]">
              {form.imageName ? `Selected file: ${form.imageName}` : 'Optional, but useful for faster troubleshooting.'}
            </p>
          </label>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-[18px] px-4 py-4 text-sm font-semibold text-white !shadow-[0_16px_30px_rgba(110,75,42,0.28)] transition-all duration-300 ease-out active:scale-95"
              style={{ background: 'linear-gradient(135deg, #A9745B, #6E4B2A)' }}
            >
              Submit Request
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-[18px] bg-[#F4ECE7] px-4 py-4 text-sm font-semibold text-[#8B5E3C] transition-all duration-300 ease-out active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[24px] bg-white p-4 !shadow-[0_14px_34px_rgba(30,30,30,0.08)]">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-[18px] bg-[#FBF8F5] px-3.5 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4ECE7] text-[#8B5E3C]">
              <LuWrench className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-[#1E1E1E]">Track service progress</span>
          </div>

          <div className="flex items-center gap-3 rounded-[18px] bg-[#FBF8F5] px-3.5 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4ECE7] text-[#8B5E3C]">
              <LuImage className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-[#1E1E1E]">Attach issue photos for better support</span>
          </div>
        </div>
      </section>
    </div>
  );
}
