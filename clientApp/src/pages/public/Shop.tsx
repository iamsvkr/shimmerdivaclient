import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { itemsApi } from '../../api/items'
import { categoriesApi } from '../../api/categories'
import { materialsApi } from '../../api/materials'
import type { Item } from '../../api/items'
import type { Category } from '../../api/categories'
import type { Material } from '../../api/materials'
import { useAppDispatch } from '../../app/hooks'
import { addToCart } from '../../features/cart/cartSlice'
import Toast from '../../components/Toast'

const PAGE_SIZE = 12

const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [toast, setToast] = useState('')

  // Filter state
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '')
  const [materialId, setMaterialId] = useState(searchParams.get('materialId') ?? '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, size: PAGE_SIZE, sortBy, sortDir }
      if (categoryId) params.categoryId = categoryId
      if (materialId) params.materialId = materialId
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice

      let res
      if (search.trim()) {
        res = await itemsApi.getPublicAll({ ...params, q: search.trim() })
      } else {
        res = await itemsApi.getPublicAll(params)
      }
      setItems(res?.content ?? [])
      setTotal(res?.totalElements ?? 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, materialId, minPrice, maxPrice, sortBy, sortDir])

  useEffect(() => {
    Promise.allSettled([categoriesApi.getAll(), materialsApi.getAll()]).then(([cats, mats]) => {
      if (cats.status === 'fulfilled') setCategories(cats.value ?? [])
      if (mats.status === 'fulfilled') setMaterials(mats.value ?? [])
    })
  }, [])

  useEffect(() => {
    setPage(0)
    load(0)
  }, [load])

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    load(0)
  }

  const handleClear = () => {
    setSearch('')
    setCategoryId('')
    setMaterialId('')
    setMinPrice('')
    setMaxPrice('')
    setSearchParams({})
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    load(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddToCart = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(addToCart({
      itemId: item.id,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      imageUrl: item.images?.[0]?.imageUrl,
      quantity: 1,
    }))
    setToast(`${item.name} added to cart`)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="shop-header">
        <div className="container">
          <h1>Our Collection</h1>
          <p>{total > 0 ? `${total} handcrafted pieces` : 'Discover timeless beauty'}</p>
        </div>
      </div>

      <div className="container">
        <div className="shop-layout">
          {/* ── Filters Sidebar ── */}
          <aside>
            <form className="filters-sidebar" onSubmit={handleApplyFilters}>
              <h3>Filter & Refine</h3>

              {/* Search */}
              <div className="filter-group">
                <div className="filter-group-title">Search</div>
                <div className="search-bar" style={{ maxWidth: '100%', borderRadius: 8 }}>
                  <span>🔍</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search jewellery…"
                  />
                </div>
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div className="filter-group">
                  <div className="filter-group-title">Category</div>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="cat"
                      value=""
                      checked={categoryId === ''}
                      onChange={() => setCategoryId('')}
                    />
                    All Categories
                  </label>
                  {categories.filter(c => c.active).map((c) => (
                    <label key={c.id} className="filter-option">
                      <input
                        type="radio"
                        name="cat"
                        value={c.id}
                        checked={categoryId === String(c.id)}
                        onChange={() => setCategoryId(String(c.id))}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              )}

              {/* Material */}
              {materials.length > 0 && (
                <div className="filter-group">
                  <div className="filter-group-title">Material</div>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="mat"
                      value=""
                      checked={materialId === ''}
                      onChange={() => setMaterialId('')}
                    />
                    All Materials
                  </label>
                  {materials.filter(m => m.active).map((m) => (
                    <label key={m.id} className="filter-option">
                      <input
                        type="radio"
                        name="mat"
                        value={m.id}
                        checked={materialId === String(m.id)}
                        onChange={() => setMaterialId(String(m.id))}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="filter-group">
                <div className="filter-group-title">Price Range (₹)</div>
                <div className="price-inputs">
                  <input
                    className="price-input"
                    type="number"
                    placeholder="Min"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>—</span>
                  <input
                    className="price-input"
                    type="number"
                    placeholder="Max"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="filter-apply-btn">Apply Filters</button>
              <button type="button" className="clear-filters" onClick={handleClear}>Clear All</button>
            </form>
          </aside>

          {/* ── Product Grid ── */}
          <div>
            <div className="shop-toolbar">
              <span className="shop-count">
                {loading ? 'Loading…' : `${total} items found`}
              </span>
              <select
                className="shop-sort"
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split('-')
                  setSortBy(s)
                  setSortDir(d)
                }}
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name A–Z</option>
              </select>
            </div>

            {loading ? (
              <div className="page-loading"><div className="spinner" /></div>
            ) : items.length === 0 ? (
              <div className="no-results">
                <span className="no-results-icon">💎</span>
                <p>No jewellery found. Try adjusting your filters.</p>
                <button className="btn-ghost" style={{ marginTop: 16 }} onClick={handleClear}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {items.map((item) => {
                    const discount = item.discountPrice && item.price > item.discountPrice
                      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
                      : 0
                    return (
                      <div
                        key={item.id}
                        className="product-card"
                        onClick={() => navigate(`/item/${item.id}`, { state: { item } })}
                      >
                        <div className="product-image-wrap">
                          {item.images?.[0] ? (
                            <img src={item.images[0].imageUrl} alt={item.name} />
                          ) : (
                            <div className="product-placeholder">💎</div>
                          )}
                          {discount > 0 && (
                            <span className="product-badge sale">{discount}% OFF</span>
                          )}
                          <button
                            className="product-wishlist"
                            onClick={(e) => e.stopPropagation()}
                            title="Add to wishlist"
                          >
                            🤍
                          </button>
                        </div>
                        <div className="product-info">
                          {item.categoryName && (
                            <div className="product-category">{item.categoryName}</div>
                          )}
                          <div className="product-name">{item.name}</div>
                          {item.materialName && (
                            <div className="product-material">{item.materialName}</div>
                          )}
                          {item.averageRating ? (
                            <div className="product-rating">
                              <span className="stars">{stars(item.averageRating)}</span>
                              <span className="rating-count">({item.reviewCount})</span>
                            </div>
                          ) : null}
                          <div className="product-price">
                            <span className="price-current">
                              ₹{(item.discountPrice ?? item.price).toLocaleString()}
                            </span>
                            {discount > 0 && (
                              <span className="price-original">₹{item.price.toLocaleString()}</span>
                            )}
                            {discount > 0 && (
                              <span className="price-save">Save {discount}%</span>
                            )}
                          </div>
                          <button
                            className="product-add-btn"
                            onClick={(e) => handleAddToCart(item, e)}
                          >
                            <span>🛍</span> Add to Cart
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination-wrap">
                    <button
                      className="page-btn"
                      disabled={page === 0}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      ‹
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i).map((p) => (
                      <button
                        key={p}
                        className={`page-btn${page === p ? ' active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p + 1}
                      </button>
                    ))}
                    <button
                      className="page-btn"
                      disabled={page >= totalPages - 1}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
