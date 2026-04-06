import { useMemo, useState } from 'react';
import { warrantyPeriodOptions } from '../../data/customerOwnership';
import { APP_NAME } from '../../constants/branding';
import ProductPreviewCard from '../../components/customer/register/ProductPreviewCard';
import RegisterForm from '../../components/customer/register/RegisterForm';
import InfoSection from '../../components/customer/register/InfoSection';

const productRegistrationMeta = {
  'Mixer Grinder': {
    description: 'Fast everyday grinding and blending support for compact kitchen prep routines.',
    modelNumber: 'KH-MX500',
  },
  'Microwave Oven': {
    description: 'Reliable reheating and quick meal prep with easy daily kitchen use.',
    modelNumber: 'HC-MW22L',
  },
  'Air Fryer': {
    description: 'Crisp air-fried meals with less oil and smooth everyday performance.',
    modelNumber: 'QC-AF360',
  },
  Refrigerator: {
    description: 'Spacious fresh-food storage with dependable cooling for everyday family use.',
    modelNumber: 'KH-RF420',
  },
  'Electric Kettle': {
    description: 'Quick boiling for tea, coffee, and instant meals with simple everyday control.',
    modelNumber: 'KH-EK220',
  },
  Toaster: {
    description: 'Compact countertop toasting with consistent browning for busy mornings.',
    modelNumber: 'KH-TS210',
  },
};

const getProductMeta = (productName) =>
  productRegistrationMeta[productName] || {
    description: 'Reliable kitchen performance with warranty tracking and support in one place.',
    modelNumber: 'KH-PR100',
  };

const initialFormState = (productOptions) => ({
  productName: productOptions[0]?.name || '',
  brand: '',
  modelNumber: getProductMeta(productOptions[0]?.name || '').modelNumber,
  purchaseDate: '',
  warrantyMonths: String(warrantyPeriodOptions[1] || 12),
  invoiceName: '',
  invoiceFile: null,
});

export default function RegisterProduct({ productOptions, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => initialFormState(productOptions));

  const selectedProduct = useMemo(
    () => productOptions.find((product) => product.name === form.productName) || productOptions[0],
    [form.productName, productOptions],
  );
  const selectedMeta = useMemo(() => getProductMeta(form.productName), [form.productName]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'productName' ? { modelNumber: getProductMeta(value).modelNumber } : {}),
    }));
  };

  const handleFileChange = (event) => {
    const invoiceFile = event.target.files?.[0] || null;
    const invoiceName = event.target.files?.[0]?.name || '';
    setForm((current) => ({ ...current, invoiceName, invoiceFile }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const didSubmit = await onSubmit({
      ...form,
      modelNumber: form.modelNumber || selectedMeta.modelNumber,
      warrantyMonths: Number(form.warrantyMonths),
    });

    if (didSubmit !== false) {
      setForm(initialFormState(productOptions));
    }
  };

  return (
    <div className="space-y-4">
      <ProductPreviewCard product={selectedProduct} description={selectedMeta.description} />
      <RegisterForm
        form={form}
        productOptions={productOptions}
        warrantyOptions={warrantyPeriodOptions}
        brandPlaceholder={APP_NAME}
        onChange={handleChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
      <InfoSection />
    </div>
  );
}
