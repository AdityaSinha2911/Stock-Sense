const db = require('./database');
const { createUser, getUserByEmail } = require('./users');
const { createCategory } = require('./categories');
const { createLocation } = require('./locations');
const { createProduct } = require('./products');

/**
 * Seeds initial demo data for StockSense if records do not already exist.
 */
function seedDatabase() {
  console.log('--- Starting StockSense Database Seeding ---');

  // 1. Seed Categories
  const categoriesData = [
    { name: 'Raw Materials', description: 'Base materials for production and manufacturing' },
    { name: 'Office Furniture', description: 'Desks, chairs, and office equipment' },
    { name: 'Electrical', description: 'Cables, fixtures, and electrical components' },
    { name: 'Packaging', description: 'Boxes, wraps, and packing materials' },
    { name: 'Safety Equipment', description: 'Personal protective equipment and safety gear' }
  ];

  const categoryMap = {}; // Maps category name to its database ID

  for (const cat of categoriesData) {
    let existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(cat.name);
    if (!existing) {
      const info = createCategory(cat.name, cat.description);
      categoryMap[cat.name] = info.lastInsertRowid;
      console.log(`[+] Created category: ${cat.name}`);
    } else {
      categoryMap[cat.name] = existing.id;
      console.log(`[=] Category already exists: ${cat.name}`);
    }
  }

  // 2. Seed Locations
  const locationsData = [
    { name: 'Main Warehouse - Rack A', warehouse: 'Main Warehouse' },
    { name: 'Main Warehouse - Rack B', warehouse: 'Main Warehouse' },
    { name: 'Production Floor', warehouse: 'Main Warehouse' },
    { name: 'Warehouse 2', warehouse: 'Warehouse 2' }
  ];

  for (const loc of locationsData) {
    const existing = db.prepare('SELECT id FROM locations WHERE name = ? AND warehouse = ?').get(loc.name, loc.warehouse);
    if (!existing) {
      createLocation(loc.name, loc.warehouse);
      console.log(`[+] Created location: ${loc.name} (${loc.warehouse})`);
    } else {
      console.log(`[=] Location already exists: ${loc.name} (${loc.warehouse})`);
    }
  }

  // 3. Seed Demo Manager User
  const demoUser = {
    name: 'Rahul Sharma',
    email: 'manager@stocksense.com',
    password: '123456',
    role: 'manager'
  };

  const existingUser = getUserByEmail(demoUser.email);
  if (!existingUser) {
    createUser(demoUser.name, demoUser.email, demoUser.password, demoUser.role);
    console.log(`[+] Created demo manager: ${demoUser.name} (${demoUser.email})`);
  } else {
    console.log(`[=] Manager already exists: ${demoUser.email}`);
  }

  // 4. Seed Demo Products
  const productsData = [
    {
      name: 'Steel Rods',
      sku: 'STL-001',
      category: 'Raw Materials',
      unit: 'kg',
      reorderLevel: 30,
      totalStock: 100
    },
    {
      name: 'Portland Cement',
      sku: 'CEM-002',
      category: 'Raw Materials',
      unit: 'bags',
      reorderLevel: 50,
      totalStock: 250
    },
    {
      name: 'Office Chair',
      sku: 'CHR-101',
      category: 'Office Furniture',
      unit: 'pcs',
      reorderLevel: 10,
      totalStock: 45
    },
    {
      name: 'Wooden Desk',
      sku: 'DSK-102',
      category: 'Office Furniture',
      unit: 'pcs',
      reorderLevel: 5,
      totalStock: 20
    },
    {
      name: 'LED Panel Light',
      sku: 'LED-201',
      category: 'Electrical',
      unit: 'pcs',
      reorderLevel: 15,
      totalStock: 75
    },
    {
      name: 'PVC Pipes',
      sku: 'PVC-301',
      category: 'Raw Materials',
      unit: 'pcs',
      reorderLevel: 25,
      totalStock: 120
    },
    {
      name: 'Safety Helmet',
      sku: 'SAF-401',
      category: 'Safety Equipment',
      unit: 'pcs',
      reorderLevel: 15,
      totalStock: 60
    },
    {
      name: 'Copper Wire',
      sku: 'CPW-501',
      category: 'Electrical',
      unit: 'rolls',
      reorderLevel: 15,
      totalStock: 8
    }
  ];

  for (const prod of productsData) {
    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(prod.sku);
    if (!existing) {
      const categoryId = categoryMap[prod.category];
      createProduct(
        prod.name,
        prod.sku,
        categoryId,
        prod.unit,
        prod.reorderLevel,
        prod.totalStock
      );
      console.log(`[+] Created product: ${prod.name} (${prod.sku})`);
    } else {
      console.log(`[=] Product already exists: ${prod.sku}`);
    }
  }

  console.log('--- StockSense Database Seeding Finished Successfully ---');
}

// Allow direct execution from command line via: node DB/seed.js
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase
};
