"""
Seed the database with sample data for the ALU Tracker demo.
Run: python seed.py
"""
from app import create_app
from models import db, User, Course, Enrollment, LearningActivity, Skill, Goal
from datetime import datetime, timedelta
import bcrypt


def seed():
    app = create_app()
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        print("[OK] Tables created")

        # ── Demo User ──────────────────────────────────────────
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

        # ── Admin User ─────────────────────────────────────────
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

        # ── Courses ────────────────────────────────────────────
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

        # ── Enrollments ────────────────────────────────────────
        enrollment_data = [
            (courses[0], 9),   # DSA — 75%
            (courses[1], 6),   # ML — 60%
            (courses[2], 15),  # WebDev — 100%
            (courses[3], 5),   # BizComm — 62.5%
            (courses[4], 3),   # Entrepreneurship — 30%
        ]
        enrollments = []
        for course, completed in enrollment_data:
            e = Enrollment(
                user_id=user.id,
                course_id=course.id,
                completed_modules=completed,
                enrolled_at=datetime.utcnow() - timedelta(days=30),
                last_activity=datetime.utcnow() - timedelta(days=1)
            )
            db.session.add(e)
            enrollments.append(e)

        # ── Learning Activities ────────────────────────────────
        activities_data = [
            (courses[0], 'Binary Trees Deep Dive', 'Study', 90, 'Studied BST operations and balancing', -1),
            (courses[1], 'Linear Regression Lab', 'Assignment', 120, 'Completed regression notebook', -2),
            (courses[2], 'React Hooks Workshop', 'Study', 60, 'Learned useState and useEffect', -2),
            (courses[0], 'Graph Algorithms Quiz', 'Quiz', 45, 'Scored 88/100 on BFS/DFS', -3),
            (courses[3], 'Presentation Skills Practice', 'Study', 50, 'Practiced ALU pitch presentation', -3),
            (courses[4], 'Business Plan Draft', 'Project', 180, 'Drafted first business plan', -5),
            (courses[2], 'API Integration Project', 'Project', 150, 'Built CRUD REST API', -5),
            (courses[1], 'Neural Networks Reading', 'Reading', 60, 'Read chapter on backpropagation', -6),
            (courses[0], 'Dynamic Programming Problems', 'Study', 120, 'Solved 5 LeetCode DP problems', -7),
            (courses[3], 'Group Discussion Notes', 'Study', 40, 'Communication frameworks review', -8),
            (courses[2], 'CSS Animations Tutorial', 'Study', 75, 'Built animated landing page', -9),
            (courses[5], 'SQL Joins Practice', 'Assignment', 90, 'Complex multi-table queries', -10),
        ]
        for course, title, atype, duration, notes, days_ago in activities_data:
            a = LearningActivity(
                user_id=user.id,
                course_id=course.id,
                title=title,
                activity_type=atype,
                duration_mins=duration,
                notes=notes,
                date=datetime.utcnow() + timedelta(days=days_ago)
            )
            db.session.add(a)

        # ── Skills ─────────────────────────────────────────────
        skills_data = [
            ('Python', 85, 'Technical', '#3776AB'),
            ('JavaScript', 78, 'Technical', '#F7DF1E'),
            ('Data Analysis', 70, 'Technical', '#E63946'),
            ('Problem Solving', 82, 'Soft Skills', '#2DC653'),
            ('Communication', 75, 'Soft Skills', '#7B2D8B'),
            ('React.js', 72, 'Technical', '#61DAFB'),
            ('Leadership', 65, 'Leadership', '#F4A261'),
            ('Critical Thinking', 80, 'Soft Skills', '#2A9D8F'),
            ('SQL', 68, 'Technical', '#457B9D'),
            ('Machine Learning', 55, 'Technical', '#F72585'),
        ]
        for name, level, cat, color in skills_data:
            s = Skill(user_id=user.id, name=name, level=level, category=cat, color=color)
            db.session.add(s)

        # ── Goals ──────────────────────────────────────────────
        goals_data = [
            ('Complete DSA Course', 'Finish all 12 modules and pass the final exam', 75, 'active', 'Academic', 30),
            ('Build Portfolio Website', 'Create a professional portfolio showcasing my projects', 60, 'active', 'Career', 45),
            ('Master Machine Learning', 'Complete ML course and build 3 projects', 40, 'active', 'Skill', 60),
            ('Improve Python to 95%', 'Practice daily coding challenges and advanced topics', 89, 'active', 'Skill', 90),
            ('Lead a Student Project', 'Take leadership role in group capstone project', 100, 'completed', 'Leadership', -10),
            ('Read 5 Tech Books', 'Expand knowledge through reading technical literature', 80, 'active', 'Academic', 120),
        ]
        for title, desc, prog, status, cat, days in goals_data:
            g = Goal(
                user_id=user.id,
                title=title,
                description=desc,
                progress=prog,
                status=status,
                category=cat,
                target_date=datetime.utcnow() + timedelta(days=days)
            )
            db.session.add(g)

        db.session.commit()
        print("Database seeded successfully!")
        print("Demo login: demo@alu.edu  |  Password: demo1234")


if __name__ == '__main__':
    seed()
