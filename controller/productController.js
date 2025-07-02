const fs = require("fs");
const csv = require("csv-parser");
const product = require("../models/product");
const generateEAN = require("../utils/generateEAN");

const uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const products = [];
  const errors = [];

  try {
    const rawRows = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          console.log("Parsed row:", row);
          rawRows.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    for (const row of rawRows) {
      try {
        if (!row.style_code || !row.option_code || !row.MRP || !row.Brick) {
          throw new Error("Missing required fields");
        }

        const sleeveValue = row.Sleeve ? row.Sleeve.trim() : 'Sleeveless';

        let ean;
        let isUnique = false;
        while (!isUnique) {
          ean = generateEAN();
          const exists = await product.findOne({ EAN_code: ean });
          if (!exists) isUnique = true;
        }

        products.push({
          style_code: row.style_code.trim(),
          option_code: row.option_code.trim(),
          MRP: parseFloat(row.MRP),
          Brick: row.Brick.trim(),
          Sleeve: sleeveValue,
          EAN_code: ean,
        });
      } catch (err) {
        errors.push({ 
          row: JSON.stringify(row), 
          error: err.message 
        });
      }
    }

    const inserted = await product.insertMany(products, { ordered: false });
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "Products uploaded successfully",
      successCount: inserted.length,
      errorCount: errors.length,
      errors: errors.map(e => `${e.error} in row: ${e.row}`),
    });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Failed to upload products", detail: error.message });
  }
};

const getFilters = async (req, res) => {
  try {
    const filters = await product.aggregate([
      {
        $group: {
          _id: null,
          style_codes: { $addToSet: "$style_code" },
          option_codes: { $addToSet: "$option_code" },
          mrps: { $addToSet: "$MRP" },
          bricks: { $addToSet: "$Brick" },
          sleeves: { $addToSet: "$Sleeve" },
          totalProducts: { $sum: 1 },
          uniqueOptions: { $addToSet: "$option_code" }
        }
      },
      {
        $project: {
          _id: 0,
          style_codes: 1,
          option_codes: 1,
          mrps: 1,
          bricks: 1,
          sleeves: 1,
          totalProducts: 1,
          uniqueOptionsCount: { $size: "$uniqueOptions" }
        }
      }
    ]);
    
    res.status(200).json(filters[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGroupedProducts = async (req, res) => {
  try {
    const { style_code, option_code, MRP, Brick, Sleeve } = req.query;
    
    const filter = {};
    if (style_code) filter.style_code = style_code;
    if (option_code) filter.option_code = option_code;
    if (MRP) filter.MRP = parseFloat(MRP);
    if (Brick) filter.Brick = Brick;
    if (Sleeve) filter.Sleeve = Sleeve;
    
    const products = await product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$option_code",
          products: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadCSV,
  getFilters,
  getGroupedProducts
};