import { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import Card from '../components/Card';
import FormField from '../components/FormField';
import SectionBlock from '../components/SectionBlock';
import ImageUpload from '../components/ImageUpload';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

export default function AddBatch() {
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [latestTax, setLatestTax] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [manufacturerBatchId, setManufacturerBatchId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [showNewProductPrompt, setShowNewProductPrompt] = useState(false);

  useEffect(() => {
    const lower = productId.toLowerCase();
    if (lower === 'new') {
      setShowNewProductPrompt(true);
      setName('');
      setSellingPrice('');
      setLatestTax('');
    } else if (productId.length > 3) {
      setShowNewProductPrompt(false);
      setName('Bell Pepper');
      setSellingPrice('8.99');
      setLatestTax('5');
    } else {
      setShowNewProductPrompt(false);
    }
  }, [productId]);

  const handleSave = () => {
    // Placeholder: implement save logic or emit event
    // eslint-disable-next-line no-console
    console.log('Save batch', {
      productId,
      name,
      prices: { buyingPrice, sellingPrice },
      latestTax,
      stock,
      expiryDate,
      manufacturerBatchId,
      batchNumber,
    });
  };

  const handleClear = () => {
    setProductId('');
    setName('');
    setSellingPrice('');
    setLatestTax('');
    setBuyingPrice('');
    setStock('');
    setExpiryDate('');
    setManufacturerBatchId('');
    setBatchNumber('');
    setShowNewProductPrompt(false);
  };

  return (
    <PageLayout mainId="add-batch-page">
      <Header title="Add New Batch" subtitle="Enter batch details for a new or existing product." right={null} />

      <div id="batch-entry-form" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Form Fields */}
        <Card className="lg:col-span-2">
          <div className="space-y-5">
            <div id="scan-product-section">
              <FormField
                id="product_id"
                label="Scan Product Code (Barcode/QR)"
                placeholder="Scan or enter code to auto-fill details"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                leftIconClass="fa-solid fa-barcode"
                inputProps={{ className: 'w-full pl-12 pr-4 py-3 bg-gray-50 border border-border-light rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow' }}
              />
            </div>

            <SectionBlock title="Product Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="name"
                  label="Product Name"
                  placeholder="e.g., Organic Bananas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {showNewProductPrompt && (
                  <div className="md:col-span-1">
                    <p className="text-sm text-sky-600 bg-sky-50 p-3 rounded-lg">
                      <i className="fa-solid fa-info-circle mr-2" />
                      New product detected. Please fill in the details below.
                    </p>
                  </div>
                )}
              </div>
            </SectionBlock>

            <SectionBlock title="Batch Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="buying_price"
                  label="Buying Price ($)"
                  type="number"
                  placeholder="0.00"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                />
                <FormField
                  id="selling_price"
                  label="Selling Price ($)"
                  type="number"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
                <FormField
                  id="latest_tax"
                  label="Tax Rate (%)"
                  type="number"
                  placeholder="e.g., 8"
                  value={latestTax}
                  onChange={(e) => setLatestTax(e.target.value)}
                />
                <FormField
                  id="stock"
                  label="Stock Quantity"
                  type="number"
                  placeholder="e.g., 100"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                <FormField
                  id="expiry_date"
                  label="Expiry Date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  inputProps={{ className: 'w-full px-4 py-2 bg-gray-50 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-text-secondary' }}
                />
                <FormField
                  id="manufacturer_batch_id"
                  label="Manufacturer Batch ID (Optional)"
                  placeholder="e.g., MFR-XYZ-123"
                  value={manufacturerBatchId}
                  onChange={(e) => setManufacturerBatchId(e.target.value)}
                />
                <div className="md:col-span-2">
                  <FormField
                    id="number"
                    label="Batch Number"
                    type="number"
                    placeholder="e.g., 1"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                  />
                </div>
              </div>
            </SectionBlock>
          </div>
        </Card>

        {/* Right Panel: Image Upload & Actions */}
        <div className="flex flex-col gap-6">
          <ImageUpload />

          <Card>
            <div className="space-y-3">
              <PrimaryButton onClick={handleSave}>
                <i className="fa-solid fa-check-circle mr-2" />Add Batch to Inventory
              </PrimaryButton>
              <SecondaryButton onClick={handleClear}>
                <i className="fa-solid fa-eraser mr-2" />Clear Form
              </SecondaryButton>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
} 