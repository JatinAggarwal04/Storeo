import { useState, useEffect, useRef } from 'react'
import {
    getCategories,
    createCategory,
    deleteCategory,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
} from '../services/api'
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '../data/demoProducts'

export default function Inventory({ business }) {
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [showAddCat, setShowAddCat] = useState(false)
    const [showProductModal, setShowProductModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteCatConfirm, setDeleteCatConfirm] = useState(null)
    const isDemo = !business

    // Product form state
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        image_urls: [],
    })
    const [uploading, setUploading] = useState(false)
    const [savingProduct, setSavingProduct] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (isDemo) {
            setCategories(DEMO_CATEGORIES)
            setProducts(DEMO_PRODUCTS)
            setLoading(false)
        } else if (business?.id) {
            fetchCategories()
        }
    }, [business?.id])

    useEffect(() => {
        if (isDemo) {
            if (selectedCategory) {
                setProducts(DEMO_PRODUCTS.filter(p => p.category_id === selectedCategory))
            } else {
                setProducts(DEMO_PRODUCTS)
            }
        } else if (business?.id) {
            fetchProducts()
        }
    }, [business?.id, selectedCategory])

    const fetchCategories = async () => {
        try {
            const data = await getCategories(business.id)
            setCategories(data.categories || [])
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const data = await getProducts(business.id, selectedCategory)
            setProducts(data.products || [])
        } catch (err) {
            console.error('Failed to fetch products:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCategory = async () => {
        const name = newCatName.trim()
        if (!name || isDemo) return
        try {
            await createCategory(business.id, name)
            setNewCatName('')
            setShowAddCat(false)
            fetchCategories()
        } catch (err) {
            console.error('Failed to create category:', err)
        }
    }

    const handleDeleteCategory = async (catId) => {
        if (isDemo) return
        try {
            await deleteCategory(catId)
            if (selectedCategory === catId) setSelectedCategory(null)
            setDeleteCatConfirm(null)
            fetchCategories()
            fetchProducts()
        } catch (err) {
            console.error('Failed to delete category:', err)
        }
    }

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length || !business?.id) return

        const remaining = 3 - productForm.image_urls.length
        const toUpload = files.slice(0, remaining)

        setUploading(true)
        try {
            const urls = []
            for (const file of toUpload) {
                const result = await uploadImage(business.id, file)
                if (result.url) urls.push(result.url)
            }
            setProductForm(prev => ({
                ...prev,
                image_urls: [...prev.image_urls, ...urls],
            }))
        } catch (err) {
            console.error('Upload failed:', err)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeImage = (index) => {
        setProductForm(prev => ({
            ...prev,
            image_urls: prev.image_urls.filter((_, i) => i !== index),
        }))
    }

    const openAddProduct = () => {
        setEditingProduct(null)
        setProductForm({ name: '', description: '', price: '', image_urls: [] })
        setShowProductModal(true)
    }

    const openEditProduct = (product) => {
        if (isDemo) return
        setEditingProduct(product)
        setProductForm({
            name: product.name,
            description: product.description || '',
            price: product.price || '',
            image_urls: product.image_urls || [],
        })
        setShowProductModal(true)
    }

    const handleSaveProduct = async () => {
        if (!productForm.name.trim() || isDemo) return
        setSavingProduct(true)
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, {
                    name: productForm.name,
                    description: productForm.description,
                    price: productForm.price ? parseFloat(productForm.price) : null,
                    image_urls: productForm.image_urls,
                })
            } else {
                const catId = selectedCategory || categories[0]?.id
                if (!catId) {
                    alert('Please create a category first')
                    setSavingProduct(false)
                    return
                }
                await createProduct({
                    business_id: business.id,
                    category_id: catId,
                    name: productForm.name,
                    description: productForm.description,
                    price: productForm.price ? parseFloat(productForm.price) : null,
                    image_urls: productForm.image_urls,
                })
            }
            setShowProductModal(false)
            fetchProducts()
        } catch (err) {
            console.error('Failed to save product:', err)
        } finally {
            setSavingProduct(false)
        }
    }

    const handleDeleteProduct = async (productId) => {
        if (isDemo) return
        try {
            await deleteProduct(productId)
            setDeleteConfirm(null)
            fetchProducts()
        } catch (err) {
            console.error('Failed to delete product:', err)
        }
    }

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2>Inventory</h2>
                    <p>{isDemo ? 'Demo products — set up a business to manage your own' : `Manage products for ${business.name}`}</p>
                </div>
                {!isDemo && (
                    <button className="btn btn-primary" onClick={openAddProduct}>
                        + Add Product
                    </button>
                )}
            </div>

            {isDemo && (
                <div className="demo-banner">
                    <span className="demo-banner-icon">👀</span>
                    <span>You're viewing demo products. <strong>Set up a business</strong> to add and manage your own inventory.</span>
                </div>
            )}

            <div className="inventory-layout">
                {/* Categories Sidebar */}
                <div className="inventory-sidebar">
                    <h3>
                        Categories
                        {!isDemo && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowAddCat(!showAddCat)}
                                style={{ padding: '4px 8px', fontSize: '16px' }}
                            >
                                +
                            </button>
                        )}
                    </h3>

                    {showAddCat && !isDemo && (
                        <div className="add-category-inline" style={{ marginBottom: '12px' }}>
                            <input
                                className="input"
                                placeholder="Category name"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                autoFocus
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleAddCategory}>
                                Add
                            </button>
                        </div>
                    )}

                    <div className="category-list">
                        <div
                            className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            <span>All Products</span>
                            <span className="cat-count">{isDemo ? DEMO_PRODUCTS.length : products.length}</span>
                        </div>
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <span>{cat.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {!isDemo && (
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: '2px 4px', fontSize: '10px', color: 'var(--text-muted)' }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteCatConfirm(cat)
                                            }}
                                            title="Delete category"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {categories.length === 0 && !showAddCat && !isDemo && (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            No categories yet.<br />Click + to add one.
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                <div>
                    {loading ? (
                        <div className="page-loading">
                            <div className="spinner" style={{ width: 32, height: 32 }}></div>
                            <span>Loading products...</span>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <h3>No Products Yet</h3>
                            <p>
                                {categories.length === 0
                                    ? 'Create a category first, then add your products.'
                                    : 'Click "Add Product" to add your first product.'}
                            </p>
                        </div>
                    ) : (
                        <div className="card-grid">
                            {products.map(product => (
                                <div key={product.id} className="product-card">
                                    <div className="product-card-image">
                                        {product.image_urls?.length > 0 ? (
                                            <img src={product.image_urls[0]} alt={product.name} />
                                        ) : (
                                            <span className="no-image">📷</span>
                                        )}
                                    </div>
                                    <div className="product-card-body">
                                        <h4>{product.name}</h4>
                                        <p className="product-desc">{product.description || 'No description'}</p>
                                        <div className="product-card-footer">
                                            <span className="product-price">
                                                {product.price ? `₹${parseFloat(product.price).toLocaleString('en-IN')}` : '—'}
                                            </span>
                                            {!isDemo && (
                                                <div className="product-actions">
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => openEditProduct(product)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setDeleteConfirm(product)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {showProductModal && !isDemo && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowProductModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* Image Upload */}
                            <div className="input-group">
                                <label>Product Images (up to 3)</label>
                                {productForm.image_urls.length > 0 && (
                                    <div className="image-preview-grid" style={{ marginBottom: '8px' }}>
                                        {productForm.image_urls.map((url, i) => (
                                            <div key={i} className="image-preview">
                                                <img src={url} alt="" />
                                                <button className="remove-btn" onClick={() => removeImage(i)}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {productForm.image_urls.length < 3 && (
                                    <div
                                        className="image-upload-zone"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {uploading ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <span className="spinner"></span> Uploading...
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📸</div>
                                                <div>Click to upload images</div>
                                                <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>{3 - productForm.image_urls.length} remaining</div>
                                            </>
                                        )}
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Name */}
                            <div className="input-group">
                                <label>Product Name *</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Steel Dinner Plate"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            {/* Description */}
                            <div className="input-group">
                                <label>Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Describe your product..."
                                    value={productForm.description}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            {/* Price */}
                            <div className="input-group">
                                <label>Price (₹)</label>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 250"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                                />
                            </div>

                            {/* Category (for new products) */}
                            {!editingProduct && (
                                <div className="input-group">
                                    <label>Category</label>
                                    <select
                                        className="input"
                                        value={selectedCategory || categories[0]?.id || ''}
                                        onChange={() => { }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveProduct}
                                disabled={!productForm.name.trim() || savingProduct}
                            >
                                {savingProduct ? (
                                    <><span className="spinner" style={{ width: 14, height: 14 }}></span> Saving...</>
                                ) : (
                                    editingProduct ? 'Update Product' : 'Add Product'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Product Confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Product</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-dialog">
                                <p>Delete "<strong>{deleteConfirm.name}</strong>"? This cannot be undone.</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                    <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                    <button className="btn btn-danger" onClick={() => handleDeleteProduct(deleteConfirm.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Category Confirm */}
            {deleteCatConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteCatConfirm(null)}>
                    <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Category</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setDeleteCatConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-dialog">
                                <p>Delete "<strong>{deleteCatConfirm.name}</strong>" and all its products? This cannot be undone.</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                    <button className="btn btn-secondary" onClick={() => setDeleteCatConfirm(null)}>Cancel</button>
                                    <button className="btn btn-danger" onClick={() => handleDeleteCategory(deleteCatConfirm.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
