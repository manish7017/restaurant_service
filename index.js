import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";

const { connect, connection, Schema, model, Types } = mongoose;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
connect("mongodb://localhost:27017/restaurant_db");

const db = connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// product model
const productSchema = new Schema({
  name: String,
  price: Number,
  description: String,
});
const Product = model("Product", productSchema);

// order model
const orderSchema = new Schema({
  products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  totalPrice: Number,
  customerName: String,
  customerEmail: String,
  createdAt: { type: Date, default: Date.now },
});
const Order = model("Order", orderSchema);

// new product
app.post("/products", async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const newProduct = new Product({ name, price, description });
    console.log(newProduct); //debug
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// add bulk products
app.post("/products/bulk", async (req, res) => {
  try {
    const products = req.body;
    const newProducts = await Product.insertMany(products);
    console.log(newProducts); //debug
    res.status(201).json(newProducts);
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
    const productIds = products.map(
      (productId) => new Types.ObjectId(productId)
    );
    const productsData = await Product.find({ _id: { $in: productIds } });
    const totalPrice = productsData.reduce(
      (total, product) => total + product.price,
      0
    );
    const newOrder = new Order({
      products: productIds,
      totalPrice,
      customerName,
      customerEmail,
    });

    console.log(newOrder); //debug
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// order details
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
