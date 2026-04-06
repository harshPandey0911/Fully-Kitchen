import { LuBell, LuPackage } from 'react-icons/lu';
import { formatDisplayDate } from '../../../data/customerOwnership';

const statusStyles = {
  active: 'bg-[#EAF7EF] text-[#1F8A4D]',
  expiring: 'bg-[#FFF2E8] text-[#D97706]',
  expired: 'bg-[#FDECEC] text-[#D14343]',
};

export default function ProductCard({ product }) {
  const hasWarranty = product.warranty && product.warranty.status !== 'unknown';
  const statusLabel = hasWarranty
    ? product.warranty.status === 'expired'
      ? 'Expired'
      : product.warranty.daysRemaining <= 30
        ? 'Expiring'
        : 'Active'
    : product.priceLabel
      ? 'Available'
      : 'Not registered';
  const statusClass = statusStyles[statusLabel.toLowerCase()] || 'bg-[#F4ECE7] text-[#8B5E3C]';

  return (
    <article className="overflow-hidden rounded-[22px] bg-white !shadow-[0_14px_34px_rgba(30,30,30,0.08)] transition-all duration-300 ease-out active:scale-95">
      <img src={product.image} alt={product.productName} className="h-28 w-full object-cover" />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-5 text-[#1E1E1E]">{product.productName}</h2>
            <p className="mt-1 text-xs text-[#6B6B6B]">{product.brand}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="space-y-2 rounded-[18px] bg-[#FBF8F5] p-3">
          <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
            <LuBell className="h-3.5 w-3.5 flex-none text-[#8B5E3C]" />
            <span className="truncate">
              {hasWarranty
                ? product.warranty.status === 'expired'
                  ? `Expired on ${formatDisplayDate(product.warranty.expiryDate)}`
                  : `${product.warranty.daysRemaining} days remaining`
                : product.priceLabel
                  ? 'Available in retailer inventory. Register to activate warranty'
                  : 'Register to activate warranty'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
            <LuPackage className="h-3.5 w-3.5 flex-none text-[#8B5E3C]" />
            <span className="truncate">{product.modelNumber || 'Model not set'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px] text-[#6B6B6B]">
          {hasWarranty ? (
            <>
              <span className="rounded-full bg-[#F4ECE7] px-2.5 py-1 font-medium text-[#8B5E3C]">
                {product.warrantyMonths} months
              </span>
              <span className="truncate">Expires {formatDisplayDate(product.warranty.expiryDate)}</span>
            </>
          ) : (
            <span className="rounded-full bg-[#F4ECE7] px-2.5 py-1 font-medium text-[#8B5E3C]">
              {product.priceLabel || 'Register product'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
