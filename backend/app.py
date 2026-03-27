from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from models import db

def create_app():
    app = Flask(__name__)

    # Config
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///alu_tracker.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'alu-super-secret-jwt-key-2024'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

    # Extensions
    db.init_app(app)
    JWTManager(app)

    CORS(app, resources={
        r"/api/*": {
            "origins": ["https://alu-smart-tracker-1.onrender.com"]
        }
    })

    # Register blueprints
    from routes.auth import auth_bp
    from routes.courses import courses_bp
    from routes.activities import activities_bp
    from routes.skills import skills_bp
    from routes.goals import goals_bp
    from routes.dashboard import dashboard_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(activities_bp, url_prefix='/api/activities')
    app.register_blueprint(skills_bp, url_prefix='/api/skills')
    app.register_blueprint(goals_bp, url_prefix='/api/goals')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Create tables
    with app.app_context():
        db.create_all()

        from seed import seed
        seed()

    return app


app = create_app()


if __name__ == '__main__':
    print("ALU Tracker API running on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000)
