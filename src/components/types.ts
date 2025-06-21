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
  
  export interface ToDoItem {
    id: string;
    task: string;
    done: boolean;
    product?: Product;
    supermarket?: {
      name: string;
      coordinates: [number, number];
    };
  }