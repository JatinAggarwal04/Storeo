from flask import Blueprint, request, jsonify
from services.inventory_service import (
    create_category,
    get_categories,
    delete_category,
    create_product,
    get_products,
    get_product,
    update_product,
    delete_product,
    upload_image,
    search_products,
)

inventory_bp = Blueprint("inventory", __name__)


# ---- Categories ----

@inventory_bp.route("/categories/<business_id>", methods=["GET"])
def list_categories(business_id):
    categories = get_categories(business_id)
    return jsonify({"categories": categories})


@inventory_bp.route("/categories", methods=["POST"])
def add_category():
    data = request.get_json()
    business_id = data.get("business_id")
    name = data.get("name")
    if not business_id or not name:
        return jsonify({"error": "business_id and name required"}), 400

    cat = create_category(business_id, name)
    if cat:
        return jsonify({"success": True, "category": cat}), 201
    return jsonify({"error": "Failed to create category"}), 500


@inventory_bp.route("/categories/<category_id>", methods=["DELETE"])
def remove_category(category_id):
    delete_category(category_id)
    return jsonify({"success": True})


# ---- Products ----

@inventory_bp.route("/products/<business_id>", methods=["GET"])
def list_products(business_id):
    category_id = request.args.get("category_id")
    products = get_products(business_id, category_id)
    return jsonify({"products": products})


@inventory_bp.route("/products", methods=["POST"])
def add_product():
    data = request.get_json()
    required = ["business_id", "category_id", "name"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    product = create_product(data)
    if product:
        return jsonify({"success": True, "product": product}), 201
    return jsonify({"error": "Failed to create product"}), 500


@inventory_bp.route("/products/detail/<product_id>", methods=["GET"])
def get_one_product(product_id):
    product = get_product(product_id)
    if product:
        return jsonify({"product": product})
    return jsonify({"error": "Product not found"}), 404


@inventory_bp.route("/products/<product_id>", methods=["PUT"])
def edit_product(product_id):
    data = request.get_json()
    product = update_product(product_id, data)
    if product:
        return jsonify({"success": True, "product": product})
    return jsonify({"error": "Product not found"}), 404


@inventory_bp.route("/products/<product_id>", methods=["DELETE"])
def remove_product(product_id):
    delete_product(product_id)
    return jsonify({"success": True})


# ---- Image Upload ----

@inventory_bp.route("/upload-image", methods=["POST"])
def upload():
    business_id = request.form.get("business_id")
    if not business_id:
        return jsonify({"error": "business_id required"}), 400

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    file_data = file.read()
    url = upload_image(business_id, file_data, file.filename, file.content_type)
    return jsonify({"success": True, "url": url})


# ---- Search ----

@inventory_bp.route("/search/<business_id>", methods=["GET"])
def search(business_id):
    query = request.args.get("q", "")
    products = search_products(business_id, query)
    return jsonify({"products": products})
