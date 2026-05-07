import ProductCard from './ProductCard';

const ProductGrid = ({ products, onAddToCart, showAddButton = false }) => {
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard 
          key={product.id ?? index} 
          product={product} 
          onAddToCart={onAddToCart} 
          showAddButton={showAddButton} 
        />
      ))}
    </div>
  );
};

export default ProductGrid;
