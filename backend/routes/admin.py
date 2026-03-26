from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Course, Enrollment
from functools import wraps

admin_bp = Blueprint('admin', __name__)


# ── Helper: require admin role ─────────────────────────────
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ── Stats ──────────────────────────────────────────────────
@admin_bp.route('/stats', methods=['GET'])
@admin_required
def admin_stats():
    total_users = User.query.filter_by(is_admin=False).count()
    total_courses = Course.query.count()
    total_enrollments = Enrollment.query.count()
    return jsonify({
        'total_users': total_users,
        'total_courses': total_courses,
        'total_enrollments': total_enrollments
    }), 200


# ── List all courses ───────────────────────────────────────
@admin_bp.route('/courses', methods=['GET'])
@admin_required
def list_courses():
    courses = Course.query.all()
    result = []
    for c in courses:
        d = c.to_dict()
        d['enrollment_count'] = Enrollment.query.filter_by(course_id=c.id).count()
        result.append(d)
    return jsonify({'courses': result}), 200


# ── Create course ──────────────────────────────────────────
@admin_bp.route('/courses', methods=['POST'])
@admin_required
def create_course():
    data = request.get_json()
    required = ['name', 'instructor']
    if not data or not all(k in data for k in required):
        return jsonify({'error': 'Name and instructor are required'}), 400

    course = Course(
        name=data['name'],
        instructor=data['instructor'],
        description=data.get('description', ''),
        category=data.get('category', 'General'),
        total_modules=int(data.get('total_modules', 10)),
        color=data.get('color', '#E63946'),
        icon=data.get('icon', '📚')
    )
    db.session.add(course)
    db.session.commit()
    return jsonify({'course': course.to_dict()}), 201


# ── Edit course ────────────────────────────────────────────
@admin_bp.route('/courses/<int:course_id>', methods=['PUT'])
@admin_required
def edit_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    if 'name' in data:
        course.name = data['name']
    if 'instructor' in data:
        course.instructor = data['instructor']
    if 'description' in data:
        course.description = data['description']
    if 'category' in data:
        course.category = data['category']
    if 'total_modules' in data:
        course.total_modules = int(data['total_modules'])
    if 'color' in data:
        course.color = data['color']
    if 'icon' in data:
        course.icon = data['icon']
    db.session.commit()
    return jsonify({'course': course.to_dict()}), 200


# ── Delete course ──────────────────────────────────────────
@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@admin_required
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted'}), 200


# ── List all students ──────────────────────────────────────
@admin_bp.route('/students', methods=['GET'])
@admin_required
def list_students():
    students = User.query.filter_by(is_admin=False).all()
    result = []
    for student in students:
        enrollments = Enrollment.query.filter_by(user_id=student.id).all()
        enrolled_courses = []
        for e in enrollments:
            course = Course.query.get(e.course_id)
            if course:
                enrolled_courses.append({
                    'course_id': course.id,
                    'course_name': course.name,
                    'course_icon': course.icon,
                    'course_color': course.color,
                    'category': course.category,
                    'completed_modules': e.completed_modules,
                    'total_modules': course.total_modules,
                    'progress': round((e.completed_modules / course.total_modules) * 100) if course.total_modules > 0 else 0,
                    'enrolled_at': e.enrolled_at.isoformat(),
                })
        s = student.to_dict()
        s['enrollments'] = enrolled_courses
        s['total_enrolled'] = len(enrolled_courses)
        result.append(s)
    return jsonify({'students': result}), 200
