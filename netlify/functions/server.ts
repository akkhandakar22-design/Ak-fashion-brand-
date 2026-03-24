import express from "express";
import serverless from "serverless-http";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase config
const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const app = express();
app.use(express.json({ limit: '50mb' }));

// API Routes
app.get("/api/categories", async (req, res) => {
  try {
    const categoriesCol = collection(db, "categories");
    const snapshot = await getDocs(categoriesCol);
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { category, featured, trending, search } = req.query;
    const productsCol = collection(db, "products");
    let q = query(productsCol);

    if (category) {
      q = query(q, where("category_id", "==", category));
    }
    if (featured === "true") {
      q = query(q, where("is_featured", "==", true));
    }
    if (trending === "true") {
      q = query(q, where("is_trending", "==", true));
    }

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter(p => 
        (p as any).name?.toLowerCase().includes(searchLower) || 
        (p as any).description?.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limitVal = parseInt(req.query.limit as string) || 10;
    const totalCount = products.length;
    const totalPages = Math.ceil(totalCount / limitVal);
    const paginatedProducts = products.slice((page - 1) * limitVal, page * limitVal);

    res.json({
      products: paginatedProducts,
      pagination: {
        total: totalCount,
        page,
        limit: limitVal,
        totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const productDoc = doc(db, "products", req.params.id);
    const snapshot = await getDoc(productDoc);
    if (snapshot.exists()) {
      res.json({ id: snapshot.id, ...snapshot.data() });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Orders
app.post("/api/orders", async (req, res) => {
  try {
    const { user_id, items, total_price, payment_method, address, user_name } = req.body;
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    const orderData = {
      user_id,
      user_name: user_name || 'Guest',
      items,
      total_price,
      status: 'pending',
      payment_method,
      address,
      created_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const ordersCol = collection(db, "orders");
    const docRef = await addDoc(ordersCol, orderData);
    res.json({ success: true, orderId: docRef.id });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, where("user_id", "==", req.params.userId), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Admin Stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const usersSnapshot = await getDocs(collection(db, "users"));

    const orders = ordersSnapshot.docs.map(doc => doc.data());
    const totalSales = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);

    res.json({
      totalSales,
      totalOrders: ordersSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalProducts: productsSnapshot.size
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Admin Orders
app.get("/api/admin/orders", async (req, res) => {
  try {
    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.put("/api/admin/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const orderDoc = doc(db, "orders", req.params.id);
    await updateDoc(orderDoc, { status });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Admin Products
app.post("/api/admin/products", async (req, res) => {
  try {
    const productData = req.body;
    const productsCol = collection(db, "products");
    const docRef = await addDoc(productsCol, productData);
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

app.put("/api/admin/products/:id", async (req, res) => {
  try {
    const productData = req.body;
    const productDoc = doc(db, "products", req.params.id);
    await updateDoc(productDoc, productData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    const productDoc = doc(db, "products", req.params.id);
    await deleteDoc(productDoc);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Reviews
app.get("/api/reviews/:productId", async (req, res) => {
  try {
    const reviewsCol = collection(db, "reviews");
    const q = query(reviewsCol, where("product_id", "==", req.params.productId), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const { product_id, user_id, user_name, rating, comment } = req.body;
    const reviewData = {
      product_id,
      user_id,
      user_name: user_name || 'Anonymous',
      rating,
      comment,
      created_at: new Date().toISOString()
    };
    const reviewsCol = collection(db, "reviews");
    const docRef = await addDoc(reviewsCol, reviewData);
    
    // Update product rating and reviews count
    const productDoc = doc(db, "products", product_id);
    const productSnap = await getDoc(productDoc);
    if (productSnap.exists()) {
      const productData = productSnap.data();
      const newCount = (productData.reviews_count || 0) + 1;
      const newRating = ((productData.rating || 0) * (productData.reviews_count || 0) + rating) / newCount;
      await updateDoc(productDoc, {
        rating: newRating,
        reviews_count: newCount
      });
    }

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Failed to add review" });
  }
});

export const handler = serverless(app);
