from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint
from models import db, User, Enrollment, LearningActivity, Skill, Goal, Course
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('', methods=['GET'])
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    # Enrolled courses
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    total_courses = len(enrollments)
    avg_progress = round(sum(e.progress_percent() for e in enrollments) / total_courses, 1) if total_courses else 0

    # Activities this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_activities = LearningActivity.query.filter(
        LearningActivity.user_id == user_id,
        LearningActivity.date >= week_ago
    ).all()
    total_study_mins = sum(a.duration_mins for a in recent_activities)

    # All activities for weekly chart (last 7 days)
    weekly_data = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_activities = LearningActivity.query.filter(
            LearningActivity.user_id == user_id,
            LearningActivity.date >= day_start,
            LearningActivity.date < day_end
        ).all()
        weekly_data.append({
            'day': day.strftime('%a'),
            'minutes': sum(a.duration_mins for a in day_activities),
            'count': len(day_activities)
        })

    # Skills
    skills = Skill.query.filter_by(user_id=user_id).all()
    top_skills = sorted([s.to_dict() for s in skills], key=lambda x: x['level'], reverse=True)[:5]

    # Goals
    goals = Goal.query.filter_by(user_id=user_id).all()
    total_goals = len(goals)
    completed_goals = len([g for g in goals if g.status == 'completed'])
    active_goals = [g.to_dict() for g in goals if g.status == 'active'][:3]

    return jsonify({
        'user': user.to_dict(),
        'stats': {
            'total_courses': total_courses,
            'avg_progress': avg_progress,
            'activities_this_week': len(recent_activities),
            'study_hours_this_week': round(total_study_mins / 60, 1),
            'total_skills': len(skills),
            'completed_goals': completed_goals,
            'total_goals': total_goals,
        },
        'weekly_activity': weekly_data,
        'top_skills': top_skills,
        'active_goals': active_goals,
        'recent_enrollments': [e.to_dict() for e in enrollments[:4]]
    }), 200
