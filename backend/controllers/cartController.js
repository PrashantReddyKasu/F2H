const Cart = require("../models/Cart")
const Product = require("../models/Product")

// Get cart for current customer
exports.getCart = async (req, res) => {
  try {
    // Find or create cart for this customer
    let cart = await Cart.findOne({ customer: req.user.id }).populate({
      path: "items.product",
      select: "name price unit stock image farmer",
      populate: {
        path: "farmer",
        select: "name",
      },
    })

    if (!cart) {
      cart = new Cart({ customer: req.user.id, items: [] })
      await cart.save()
    }

    res.json(cart)
  } catch (error) {
    console.error("Get cart error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, specialPrice = null, requestId = null, requestType = null } = req.body

    // Validate product
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if quantity is available
    if (quantity > product.stock) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" })
    }

    // Find or create cart
    let cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      cart = new Cart({ customer: req.user.id, items: [] })
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId)

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity = quantity
      if (specialPrice !== null) {
        cart.items[existingItemIndex].specialPrice = specialPrice
      }
      if (requestId) {
        cart.items[existingItemIndex].requestId = requestId
        // Only set requestType if it's a valid value
        if (requestType && ["bargain", "bundle", "priceMatch"].includes(requestType)) {
          cart.items[existingItemIndex].requestType = requestType
        }
      }
    } else {
      // Add new item
      const cartItem = {
        product: productId,
        quantity,
      }

      // Only add optional fields if they have valid values
      if (specialPrice !== null) {
        cartItem.specialPrice = specialPrice
      }

      if (requestId) {
        cartItem.requestId = requestId
      }

      // Only set requestType if it's a valid value
      if (requestType && ["bargain", "bundle", "priceMatch"].includes(requestType)) {
        cartItem.requestType = requestType
      }

      cart.items.push(cartItem)
    }

    await cart.save()

    // Return populated cart
    cart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price unit stock image farmer",
      populate: {
        path: "farmer",
        select: "name",
      },
    })

    res.json(cart)
  } catch (error) {
    console.error("Add to cart error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity, specialPrice } = req.body

    // Find cart
    const cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" })
    }

    // Find item in cart
    const item = cart.items.id(itemId)
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" })
    }

    // Update item
    if (quantity !== undefined) {
      // Validate product stock
      const product = await Product.findById(item.product)
      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }

      if (quantity > product.stock) {
        return res.status(400).json({ message: "Requested quantity exceeds available stock" })
      }

      item.quantity = quantity
    }

    if (specialPrice !== undefined) {
      item.specialPrice = specialPrice
    }

    await cart.save()

    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price unit stock image farmer",
      populate: {
        path: "farmer",
        select: "name",
      },
    })

    res.json(updatedCart)
  } catch (error) {
    console.error("Update cart item error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params

    // Find cart
    const cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" })
    }

    // Remove item
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId)
    await cart.save()

    res.json(cart)
  } catch (error) {
    console.error("Remove from cart error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    // Find cart
    const cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" })
    }

    // Clear items
    cart.items = []
    await cart.save()

    res.json(cart)
  } catch (error) {
    console.error("Clear cart error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update cart item by request ID
exports.updateCartItemByRequest = async (req, res) => {
  try {
    const { requestId, specialPrice, requestType } = req.body

    // Find cart
    const cart = await Cart.findOne({ customer: req.user.id })
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" })
    }

    // Find item in cart by request ID
    const itemIndex = cart.items.findIndex((item) => item.requestId && item.requestId.toString() === requestId)

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item with this request ID not found in cart" })
    }

    // Update item
    cart.items[itemIndex].specialPrice = specialPrice

    // Only set requestType if it's a valid value
    if (requestType && ["bargain", "bundle", "priceMatch"].includes(requestType)) {
      cart.items[itemIndex].requestType = requestType
    }

    await cart.save()

    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price unit stock image farmer",
      populate: {
        path: "farmer",
        select: "name",
      },
    })

    res.json(updatedCart)
  } catch (error) {
    console.error("Update cart item by request error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
