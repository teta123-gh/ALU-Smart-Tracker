from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    program = db.Column(db.String(100), default='Software Engineering')
    year = db.Column(db.Integer, default=1)
    avatar_initials = db.Column(db.String(4), default='AU')
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    enrollments = db.relationship('Enrollment', backref='user', lazy=True, cascade='all, delete-orphan')
    activities = db.relationship('LearningActivity', backref='user', lazy=True, cascade='all, delete-orphan')
    skills = db.relationship('Skill', backref='user', lazy=True, cascade='all, delete-orphan')
    goals = db.relationship('Goal', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'program': self.program,
            'year': self.year,
            'avatar_initials': self.avatar_initials,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat()
        }


class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    instructor = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    total_modules = db.Column(db.Integer, default=10)
    color = db.Column(db.String(20), default='#E63946')
    icon = db.Column(db.String(10), default='📚')

    enrollments = db.relationship('Enrollment', backref='course', lazy=True, cascade='all, delete-orphan')
    activities = db.relationship('LearningActivity', backref='course', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'instructor': self.instructor,
            'description': self.description,
            'category': self.category,
            'total_modules': self.total_modules,
            'color': self.color,
            'icon': self.icon
        }


class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    completed_modules = db.Column(db.Integer, default=0)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)

    def progress_percent(self):
        course = Course.query.get(self.course_id)
        if course and course.total_modules > 0:
            return round((self.completed_modules / course.total_modules) * 100)
        return 0

    def to_dict(self):
        course = Course.query.get(self.course_id)
        return {
            'id': self.id,
            'course_id': self.course_id,
            'course': course.to_dict() if course else None,
            'completed_modules': self.completed_modules,
            'total_modules': course.total_modules if course else 0,
            'progress': self.progress_percent(),
            'enrolled_at': self.enrolled_at.isoformat(),
            'last_activity': self.last_activity.isoformat()
        }


class LearningActivity(db.Model):
    __tablename__ = 'learning_activities'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    activity_type = db.Column(db.String(50), default='Study')  # Study, Assignment, Project, Reading, Quiz
    duration_mins = db.Column(db.Integer, default=30)
    notes = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        course = Course.query.get(self.course_id) if self.course_id else None
        return {
            'id': self.id,
            'title': self.title,
            'activity_type': self.activity_type,
            'duration_mins': self.duration_mins,
            'notes': self.notes,
            'date': self.date.isoformat(),
            'course_id': self.course_id,
            'course_name': course.name if course else None
        }


class Skill(db.Model):
    __tablename__ = 'skills'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.Integer, default=0)  # 0-100
    category = db.Column(db.String(50), default='Technical')  # Technical, Soft, Leadership
    color = db.Column(db.String(20), default='#E63946')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
            'category': self.category,
            'color': self.color,
            'updated_at': self.updated_at.isoformat()
        }


class Goal(db.Model):
    __tablename__ = 'goals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    target_date = db.Column(db.DateTime)
    progress = db.Column(db.Integer, default=0)  # 0-100
    status = db.Column(db.String(20), default='active')  # active, completed, paused
    category = db.Column(db.String(50), default='Academic')  # Academic, Skill, Career
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'progress': self.progress,
            'status': self.status,
            'category': self.category,
            'created_at': self.created_at.isoformat()
        }
