from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, LearningActivity
from datetime import datetime

activities_bp = Blueprint('activities', __name__)


@activities_bp.route('', methods=['GET'])
@jwt_required()
def list_activities():
    user_id = int(get_jwt_identity())
    activities = LearningActivity.query.filter_by(user_id=user_id).order_by(LearningActivity.date.desc()).all()
    return jsonify({'activities': [a.to_dict() for a in activities]}), 200


@activities_bp.route('', methods=['POST'])
@jwt_required()
def create_activity():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400

    activity = LearningActivity(
        user_id=user_id,
        course_id=data.get('course_id'),
        title=data['title'],
        activity_type=data.get('activity_type', 'Study'),
        duration_mins=data.get('duration_mins', 30),
        notes=data.get('notes', ''),
        date=datetime.fromisoformat(data['date']) if 'date' in data else datetime.utcnow()
    )
    db.session.add(activity)
    db.session.commit()
    return jsonify({'activity': activity.to_dict()}), 201


@activities_bp.route('/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    user_id = int(get_jwt_identity())
    activity = LearningActivity.query.filter_by(id=activity_id, user_id=user_id).first_or_404()
    db.session.delete(activity)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
