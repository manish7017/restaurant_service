const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/restaurant_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// product model
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
});
const Product = mongoose.model("Product", productSchema);
//order model
const orderSchema = new mongoose.Schema({
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  totalPrice: Number,
  customerName: String,
  customerEmail: String,
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

// new product
app.post("/products", async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const newProduct = new Product({ name, price, description });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// update a product
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, price, description },
      { new: true }
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// remove a product
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// orders
app.post("/orders", async (req, res) => {
  try {
    const { products, customerName, customerEmail } = req.body;

    const productIds = products.map((productId) =>
      mongoose.Types.ObjectId(productId)
    );
    const productsData = await Product.find({ _id: { $in: productIds } });
    const totalPrice = productsData.reduce(
      (total, product) => total + product.price,
      0
    );

    const newOrder = new Order({
      products,
      totalPrice,
      customerName,
      customerEmail,
    });
    await newOrder.save();

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// order details
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().populate("orders");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
