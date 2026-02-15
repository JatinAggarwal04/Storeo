import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.business import business_bp
from routes.inventory import inventory_bp
from routes.whatsapp import whatsapp_bp
from routes.orders import orders_bp


def create_app():
    # Serve static files from the React app build directory
    app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret")

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(business_bp, url_prefix="/api/business")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(whatsapp_bp, url_prefix="/api/whatsapp")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        if path != "" and os.path.exists(app.static_folder + "/" + path):
            return app.send_static_file(path)
        return app.send_static_file("index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
