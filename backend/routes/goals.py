from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Goal
from datetime import datetime

goals_bp = Blueprint('goals', __name__)


@goals_bp.route('', methods=['GET'])
@jwt_required()
def list_goals():
    user_id = int(get_jwt_identity())
    goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.created_at.desc()).all()
    return jsonify({'goals': [g.to_dict() for g in goals]}), 200


@goals_bp.route('', methods=['POST'])
@jwt_required()
def create_goal():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400

    goal = Goal(
        user_id=user_id,
        title=data['title'],
        description=data.get('description', ''),
        target_date=datetime.fromisoformat(data['target_date']) if data.get('target_date') else None,
        progress=data.get('progress', 0),
        status=data.get('status', 'active'),
        category=data.get('category', 'Academic')
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({'goal': goal.to_dict()}), 201


@goals_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first_or_404()
    data = request.get_json()
    if 'progress' in data:
        goal.progress = max(0, min(100, data['progress']))
        if goal.progress == 100:
            goal.status = 'completed'
    if 'title' in data:
        goal.title = data['title']
    if 'status' in data:
        goal.status = data['status']
    if 'description' in data:
        goal.description = data['description']
    db.session.commit()
    return jsonify({'goal': goal.to_dict()}), 200


@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first_or_404()
    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
