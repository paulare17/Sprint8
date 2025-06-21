export interface Product {
  id: string;
  name: string;
  brands?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  categories?: string;
  stores?: string;
}

class OpenFoodService {
  private readonly baseURL = 'https://world.openfoodfacts.org/api/v2';

  async searchProducts(query: string, limit = 10): Promise<Product[]> {
    try {
      // Provar amb l'API v1 que suporta millor la cerca de text complet
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=1&action=process`
      );
      
      if (!response.ok) {
        throw new Error('Error fetching products');
      }

      const data = await response.json();
      
      console.log('API Response v1:', data); // Para debugging
      
      return data.products?.map((product: any) => {
        // Intentar obtener el nombre del producto
        const name = product.product_name || 
                    product.product_name_es || 
                    product.product_name_ca || 
                    product.product_name_en ||
                    product.generic_name ||
                    (product.brands ? product.brands.split(',')[0].trim() : '') ||
                    'Producto sin nombre';
        
        console.log('Product mapping v1:', { 
          code: product.code, 
          product_name: product.product_name,
          brands: product.brands,
          name: name 
        }); // Para debugging
        
        return {
          id: product.code || product._id || 'unknown',
          name: name,
          brands: product.brands,
          image_url: product.image_url,
          nutriscore_grade: product.nutriscore_grade,
          nova_group: product.nova_group,
          categories: product.categories,
          stores: product.stores
        };
      }) || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}

export const openFoodService = new OpenFoodService();
