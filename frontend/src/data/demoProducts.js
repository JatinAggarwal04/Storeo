// Demo product data for showcasing the platform
// Images served from /demo/ folder in public directory

export const DEMO_CATEGORIES = [
  { id: 'demo-cat-plates', name: 'Plates', business_id: 'demo' },
  { id: 'demo-cat-spoons', name: 'Spoons', business_id: 'demo' },
]

export const DEMO_PRODUCTS = [
  {
    id: 'demo-prod-1',
    category_id: 'demo-cat-plates',
    business_id: 'demo',
    name: 'Freakway Stoneware Ceramic Dinner Plates (Set of 6)',
    description: '10.6 Inch hand-painted ceramic dinner plates. Microwave safe. Stoneware material with beautiful artisanal patterns. Set of 6 pieces, 26.92 cm diameter.',
    price: 1499,
    image_urls: ['/demo/plates/plates-1.jpeg'],
    in_stock: true,
  },
  {
    id: 'demo-prod-2',
    category_id: 'demo-cat-plates',
    business_id: 'demo',
    name: 'Embassy French Stainless Steel Dinner Plate (Pack of 2)',
    description: 'Steel dinner plate, Size 3. Dishwasher safe, 25.7 cm diameter. Stainless steel construction perfect for everyday use and special occasions. 10.3" × 10.2" × 1.0".',
    price: 449,
    image_urls: ['/demo/plates/plates-2.jpeg'],
    in_stock: true,
  },
  {
    id: 'demo-prod-3',
    category_id: 'demo-cat-spoons',
    business_id: 'demo',
    name: 'Stainless Steel Mirror Polished Dinner Spoons (Set of 12)',
    description: 'Set of 12 mirror-polished stainless steel dinner spoons. Length 16 cm. Durable cut-edge design for daily use.',
    price: 299,
    image_urls: ['/demo/spoons/spoons-1.jpeg'],
    in_stock: true,
  },
  {
    id: 'demo-prod-4',
    category_id: 'demo-cat-spoons',
    business_id: 'demo',
    name: 'VarEesha Gold Hammered Steel Head Serving Spoons (Set of 2)',
    description: 'Premium gold-finish hammered steel head serving spoons by VarEesha. Set of two. Perfect for elegant table presentation and special occasions.',
    price: 649,
    image_urls: ['/demo/spoons/spoons-2.jpeg'],
    in_stock: true,
  },
]
