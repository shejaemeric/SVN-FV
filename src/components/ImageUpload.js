import { useRef, useState } from 'react';
import Card from './Card';

export default function ImageUpload({ title = 'Product Image', hint = 'Upload an image if this is a new product.' }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState('');

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setPreview(String(reader.result));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="text-center flex-1 flex flex-col justify-center items-center" title={title}>
      <p className="text-sm text-text-secondary mb-4">{hint}</p>
      <div className="w-48 h-48 bg-gray-100 rounded-xl border-2 border-dashed border-border-light flex items-center justify-center mb-4 overflow-hidden">
        {preview ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={preview} alt="Product Image Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-text-secondary">
            <i className="fa-solid fa-image fa-3x mb-2" />
            <p>Live Preview</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
      <button onClick={() => inputRef.current?.click()} className="w-full py-2 bg-sky-100 text-sky-600 font-semibold rounded-lg hover:bg-sky-200 transition-colors">
        <i className="fa-solid fa-upload mr-2" />Upload Image
      </button>
    </Card>
  );
} 