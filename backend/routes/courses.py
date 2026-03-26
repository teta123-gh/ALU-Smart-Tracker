from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Course, Enrollment
from datetime import datetime

courses_bp = Blueprint('courses', __name__)


@courses_bp.route('', methods=['GET'])
@jwt_required()
def list_courses():
    courses = Course.query.all()
    user_id = int(get_jwt_identity())
    enrolled_ids = {e.course_id for e in Enrollment.query.filter_by(user_id=user_id).all()}
    result = []
    for c in courses:
        d = c.to_dict()
        d['enrolled'] = c.id in enrolled_ids
        result.append(d)
    return jsonify({'courses': result}), 200


@courses_bp.route('/enrolled', methods=['GET'])
@jwt_required()
def enrolled_courses():
    user_id = int(get_jwt_identity())
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    return jsonify({'enrollments': [e.to_dict() for e in enrollments]}), 200


@courses_bp.route('/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.get_or_404(course_id)
    existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existing:
        return jsonify({'error': 'Already enrolled'}), 409
    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({'enrollment': enrollment.to_dict()}), 201


@courses_bp.route('/<int:course_id>/progress', methods=['PUT'])
@jwt_required()
def update_progress(course_id):
    user_id = int(get_jwt_identity())
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first_or_404()
    data = request.get_json()
    completed = data.get('completed_modules', enrollment.completed_modules)
    course = Course.query.get(course_id)
    enrollment.completed_modules = min(completed, course.total_modules)
    enrollment.last_activity = datetime.utcnow()
    db.session.commit()
    return jsonify({'enrollment': enrollment.to_dict()}), 200
