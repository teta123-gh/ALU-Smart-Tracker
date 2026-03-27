"""
Seed the database with sample data for the ALU Tracker demo.
Run: python seed.py
"""
from app import create_app
from models import db, User, Course, Enrollment, LearningActivity, Skill, Goal
from datetime import datetime, timedelta
import bcrypt

# Initialize app for context
app = create_app()

def seed_data():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        print("[OK] Tables created")

        # Demo User
        pwd = bcrypt.hashpw('demo1234'.encode(), bcrypt.gensalt()).decode()
        user = User(
            name='Amara Diallo',
            email='demo@alu.edu',
            password_hash=pwd,
            program='Software Engineering',
            year=2,
            avatar_initials='AD'
        )
        db.session.add(user)

         # Admin User
        admin_pwd = bcrypt.hashpw('admin1234'.encode(), bcrypt.gensalt()).decode()
        admin_user = User(
            name='ALU Admin',
            email='admin@alu.edu',
            password_hash=admin_pwd,
            program='Administration',
            year=1,
            avatar_initials='AA',
            is_admin=True
        )
        db.session.add(admin_user)
        db.session.flush()  # get user.id

        # Courses
        courses_data = [
            ('Data Structures & Algorithms', 'Dr. Kwame Asante', 'Core CS fundamentals', 'Computer Science', 12, '#E63946', '💻'),
            ('Machine Learning Fundamentals', 'Prof. Fatima Zahra', 'ML theory and practice', 'AI/ML', 10, '#F4A261', '🤖'),
            ('Web Development Bootcamp', 'Mr. Oluwaseun Adeyemi', 'Full-stack web development', 'Web Dev', 15, '#2A9D8F', '🌐'),
            ('Business Communication', 'Dr. Amina Hassan', 'Professional communication skills', 'Soft Skills', 8, '#7B2D8B', '🗣️'),
            ('Entrepreneurship & Innovation', 'Ms. Zaire Osei', 'Startup fundamentals', 'Business', 10, '#E76F51', '🚀'),
            ('Database Systems', 'Dr. Chukwuemeka Eze', 'SQL and NoSQL databases', 'Computer Science', 12, '#457B9D', '🗄️'),
            ('Leadership Development', 'Prof. Nkechi Obi', 'ALU leadership curriculum', 'Leadership', 8, '#2DC653', '👑'),
            ('Human Centered Design', 'Ms. Leila Mansouri', 'Design thinking process', 'Design', 10, '#F72585', '🎨'),
        ]
        courses = []
        for name, inst, desc, cat, mods, color, icon in courses_data:
            c = Course(name=name, instructor=inst, description=desc, category=cat,
                       total_modules=mods, color=color, icon=icon)
            db.session.add(c)
            courses.append(c)
        db.session.flush()

        # Enrollments
        enrollment_data = [
            (courses[0], 9),
            (courses[1], 6),
            (courses[2], 15),
            (courses[3], 5),
            (courses[4], 3),
        ]
        for course, completed in enrollment_data:
            e = Enrollment(
                user_id=user.id,
                course_id=course.id,
                completed_modules=completed,
                enrolled_at=datetime.utcnow() - timedelta(days=30),
                last_activity=datetime.utcnow() - timedelta(days=1)
            )
            db.session.add(e)

        
        db.session.commit()
        print("Database seeded successfully!")
        print("Demo login: demo@alu.edu  |  Password: demo1234")

if __name__ == '__main__':
    seed_data()
