const API_BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // Don't set Content-Type for FormData
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// ============ Business ============

export function chatWithAI(messages) {
  return request('/business/chat', {
    method: 'POST',
    body: { messages },
  });
}

export function createBusiness(data) {
  return request('/business/create', {
    method: 'POST',
    body: data,
  });
}

export function listBusinesses(userId) {
  let url = '/business/list';
  if (userId) url += `?user_id=${userId}`;
  return request(url);
}

export function getBusiness(id) {
  return request(`/business/${id}`);
}

export function updateBusiness(id, data) {
  return request(`/business/${id}`, {
    method: 'PUT',
    body: data,
  });
}

// ============ Categories ============

export function getCategories(businessId) {
  return request(`/inventory/categories/${businessId}`);
}

export function createCategory(businessId, name) {
  return request('/inventory/categories', {
    method: 'POST',
    body: { business_id: businessId, name },
  });
}

export function deleteCategory(categoryId) {
  return request(`/inventory/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

// ============ Products ============

export function getProducts(businessId, categoryId) {
  let url = `/inventory/products/${businessId}`;
  if (categoryId) url += `?category_id=${categoryId}`;
  return request(url);
}

export function createProduct(data) {
  return request('/inventory/products', {
    method: 'POST',
    body: data,
  });
}

export function updateProduct(productId, data) {
  return request(`/inventory/products/${productId}`, {
    method: 'PUT',
    body: data,
  });
}

export function deleteProduct(productId) {
  return request(`/inventory/products/${productId}`, {
    method: 'DELETE',
  });
}

export function searchProducts(businessId, query) {
  return request(`/inventory/search/${businessId}?q=${encodeURIComponent(query)}`);
}

// ============ Image Upload ============

export function uploadImage(businessId, file) {
  const formData = new FormData();
  formData.append('business_id', businessId);
  formData.append('file', file);
  return request('/inventory/upload-image', {
    method: 'POST',
    body: formData,
  });
}

// ============ Orders ============

export function getOrders(businessId, status) {
  let url = `/orders/${businessId}`;
  if (status) url += `?status=${status}`;
  return request(url);
}

export function updateOrderStatus(orderId, status) {
  return request(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: { status },
  });
}

export function getDashboardStats(businessId) {
  return request(`/orders/dashboard/${businessId}`);
}

// ============ WhatsApp ============

export function getWhatsAppStatus(businessId) {
  return request(`/whatsapp/status/${businessId}`);
}

export function testWhatsAppMessage(businessId, message, phone, language) {
  return request('/whatsapp/test-message', {
    method: 'POST',
    body: { business_id: businessId, message, phone, language },
  });
}

export function connectWhatsApp(businessId, code) {
  return request(`/business/${businessId}/connect-whatsapp`, {
    method: 'POST',
    body: { code },
  });
}

export function launchBot(businessId) {
  return request(`/business/${businessId}/launch`, {
    method: 'POST',
  });
}

// ============ Preferences ============

export function loadPreferences(userId, businessId) {
  // reusing getBusiness since it returns the whole object
  return getBusiness(businessId).then(data => data.business);
}

export function savePreferences(userId, businessId, prefs) {
  // reusing updateBusiness
  return updateBusiness(businessId, prefs);
}
