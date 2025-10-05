export interface Activity {
    id: number;
    title: string;
    category: string;
    categoryColor: 'success' | 'warning' | 'info' | 'warn' | 'secondary';
    description: string;
    imageUrl: string;
    routerLink: string;
  }