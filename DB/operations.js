const db = require('./database');
require('./users');
require('./locations');
require('./products');

/**
 * Creates the 'operations' table if it doesn't already exist.
 */
function createOperationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')),
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'READY', 'DONE', 'CANCELED')),
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      source_location_id INTEGER,
      destination_location_id INTEGER,
      supplier TEXT,
      customer TEXT,
      counted_quantity INTEGER,
      note TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (source_location_id) REFERENCES locations(id),
      FOREIGN KEY (destination_location_id) REFERENCES locations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `;
  db.exec(sql);
}

// Ensure the table exists upon loading the module
createOperationsTable();

/**
 * Inserts a new operation record.
 * @param {object} data - Operation details
 * @returns {object} Info object containing lastInsertRowid and changes
 */
function createOperation(data) {
  const sql = `
    INSERT INTO operations (
      type,
      status,
      product_id,
      quantity,
      source_location_id,
      destination_location_id,
      supplier,
      customer,
      counted_quantity,
      note,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const type = data.type;
  const status = data.status || 'DRAFT';
  const productId = data.product_id ?? data.productId;
  const quantity = data.quantity;
  const sourceLocationId = data.source_location_id ?? data.sourceLocationId ?? null;
  const destinationLocationId = data.destination_location_id ?? data.destinationLocationId ?? null;
  const supplier = data.supplier ?? null;
  const customer = data.customer ?? null;
  const countedQuantity = data.counted_quantity ?? data.countedQuantity ?? null;
  const note = data.note ?? null;
  const createdBy = data.created_by ?? data.createdBy ?? null;

  return db.prepare(sql).run(
    type,
    status,
    productId,
    quantity,
    sourceLocationId,
    destinationLocationId,
    supplier,
    customer,
    countedQuantity,
    note,
    createdBy
  );
}

/**
 * Retrieves all operations joined with relevant product, location, and user names.
 * @returns {Array} Array of operation objects
 */
function getAllOperations() {
  const sql = `
    SELECT 
      operations.*,
      products.name AS product_name,
      products.sku AS product_sku,
      src.name AS source_location_name,
      dest.name AS destination_location_name,
      users.name AS created_by_name
    FROM operations
    LEFT JOIN products ON operations.product_id = products.id
    LEFT JOIN locations AS src ON operations.source_location_id = src.id
    LEFT JOIN locations AS dest ON operations.destination_location_id = dest.id
    LEFT JOIN users ON operations.created_by = users.id
    ORDER BY operations.created_at DESC
  `;
  return db.prepare(sql).all();
}

/**
 * Retrieves a single operation by its ID joined with related info.
 * @param {number|string} id - Operation ID
 * @returns {object|undefined} Operation object or undefined if not found
 */
function getOperationById(id) {
  const sql = `
    SELECT 
      operations.*,
      products.name AS product_name,
      products.sku AS product_sku,
      src.name AS source_location_name,
      dest.name AS destination_location_name,
      users.name AS created_by_name
    FROM operations
    LEFT JOIN products ON operations.product_id = products.id
    LEFT JOIN locations AS src ON operations.source_location_id = src.id
    LEFT JOIN locations AS dest ON operations.destination_location_id = dest.id
    LEFT JOIN users ON operations.created_by = users.id
    WHERE operations.id = ?
  `;
  return db.prepare(sql).get(id);
}

/**
 * Updates an operation's status and automatically sets completed_at if status is 'DONE'.
 * @param {number|string} id - Operation ID
 * @param {string} status - New status ('DRAFT', 'READY', 'DONE', 'CANCELED')
 * @returns {object} Info object containing changes
 */
function updateOperationStatus(id, status) {
  if (status === 'DONE') {
    const sql = `
      UPDATE operations
      SET status = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return db.prepare(sql).run(status, id);
  }

  const sql = `
    UPDATE operations
    SET status = ?
    WHERE id = ?
  `;
  return db.prepare(sql).run(status, id);
}

module.exports = {
  createOperationsTable,
  createOperation,
  getAllOperations,
  getOperationById,
  updateOperationStatus
};
