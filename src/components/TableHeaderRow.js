export default function TableHeaderRow() {
  return (
    <div className="sticky top-0 bg-light-bg/80 backdrop-blur-sm pt-2 pb-3 z-10">
      <div className="grid grid-cols-12 gap-4 px-4 text-sm font-semibold text-text-secondary uppercase">
        <div className="col-span-5">Product Name</div>
        <div className="col-span-2 text-center">Stock Level</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-3 text-center">Actions</div>
      </div>
    </div>
  );
} 