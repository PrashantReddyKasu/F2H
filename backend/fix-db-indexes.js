// Run this script to fix the database indexes
const mongoose = require("mongoose")
require("dotenv").config()

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://jsunilreddy411:f2h%401234@f2h.mw4ukoj.mongodb.net/?retryWrites=true&w=majority&appName=F2H",
    )

    console.log("Connected to MongoDB")

    // Get the products collection
    const db = mongoose.connection.db
    const productsCollection = db.collection("products")

    // Drop the problematic title index if it exists
    try {
      await productsCollection.dropIndex("title_1")
      console.log("Successfully dropped the title_1 index")
    } catch (err) {
      console.log("No title_1 index found or error dropping index:", err.message)
    }

    // Drop the existing text index
    try {
      await productsCollection.dropIndex("name_text_description_text_tags_text")
      console.log("Successfully dropped the existing text index")
    } catch (err) {
      console.log("Error dropping text index:", err.message)
    }

    // Create the correct text index on name field
    await productsCollection.createIndex({ name: "text" })
    console.log("Successfully created text index on name field")

    console.log("Database indexes fixed successfully")
  } catch (error) {
    console.error("Error fixing indexes:", error)
  } finally {
    // Close the connection
    await mongoose.connection.close()
    console.log("MongoDB connection closed")
  }
}

fixIndexes()
