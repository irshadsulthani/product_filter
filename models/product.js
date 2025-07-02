const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  style_code: { type: String, required: true },
  option_code: { type: String, required: true },
  EAN_code: { type: String, required: true, unique: true },
  MRP: { type: Number },
  Brick: { type: String, enum: ['Shirt', 'T-Shirt', 'Jeans', 'Trouser'] },
  Sleeve: { type: String, enum: ['Full Sleeve', 'Half Sleeve', 'Sleeveless'] },
});

module.exports = mongoose.model('Product', productSchema);
