from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Skill
from datetime import datetime

skills_bp = Blueprint('skills', __name__)


@skills_bp.route('', methods=['GET'])
@jwt_required()
def list_skills():
    user_id = int(get_jwt_identity())
    skills = Skill.query.filter_by(user_id=user_id).all()
    return jsonify({'skills': [s.to_dict() for s in skills]}), 200


@skills_bp.route('', methods=['POST'])
@jwt_required()
def create_skill():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Skill name is required'}), 400

    skill = Skill(
        user_id=user_id,
        name=data['name'],
        level=data.get('level', 0),
        category=data.get('category', 'Technical'),
        color=data.get('color', '#E63946')
    )
    db.session.add(skill)
    db.session.commit()
    return jsonify({'skill': skill.to_dict()}), 201


@skills_bp.route('/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(skill_id):
    user_id = int(get_jwt_identity())
    skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first_or_404()
    data = request.get_json()
    if 'level' in data:
        skill.level = max(0, min(100, data['level']))
    if 'name' in data:
        skill.name = data['name']
    if 'category' in data:
        skill.category = data['category']
    skill.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'skill': skill.to_dict()}), 200


@skills_bp.route('/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    user_id = int(get_jwt_identity())
    skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first_or_404()
    db.session.delete(skill)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
