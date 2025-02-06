# routes.py
from flask import Blueprint, render_template, request, redirect, url_for, session
from models import db, Verb
from datetime import datetime
import random
from grading import grade_free_form_answer

main_blueprint = Blueprint('main', __name__)

@main_blueprint.route('/')
def index():
    return render_template('index.html')

@main_blueprint.route('/exercise', methods=['GET', 'POST'])
def exercise():
    if 'round_words' not in session:
        words = Verb.query.order_by(Verb.correct_streak.asc()).limit(10).all()
        session['round_words'] = [word.id for word in words]
        session['current_index'] = 0
        session['exercise_type'] = random.choice(['nor_to_eng', 'tenses', 'eng_to_nor'])
    
    current_index = session.get('current_index', 0)
    word_ids = session.get('round_words', [])

    if current_index >= len(word_ids):
        session.pop('round_words')
        session.pop('current_index')
        session.pop('exercise_type')
        return redirect(url_for('main.round_summary'))
    
    current_word = Verb.query.get(word_ids[current_index])
    feedback = None

    if request.method == 'POST':
        user_answer = request.form.get('user_answer', '')
        correct = False
        if session['exercise_type'] == 'nor_to_eng':
            correct_answers = [ans.strip() for ans in current_word.english_meanings.split(',')]
            correct = grade_free_form_answer(user_answer, correct_answers)
        elif session['exercise_type'] == 'tenses':
            try:
                user_past, user_participle = [part.strip() for part in user_answer.split(',')]
                correct = (user_past.lower() == current_word.past.lower() and 
                           user_participle.lower() == current_word.past_participle.lower())
            except ValueError:
                correct = False
        elif session['exercise_type'] == 'eng_to_nor':
            correct = (user_answer.strip().lower() == current_word.norwegian.strip().lower())
        
        # Update performance statistics:
        current_word.total_attempts += 1
        if correct:
            current_word.correct_streak += 1
            current_word.correct_attempts += 1
        else:
            current_word.correct_streak = 0
        current_word.last_reviewed = datetime.utcnow()
        db.session.commit()

        feedback = "Correct!" if correct else (
            f"Incorrect. The correct answer was: "
            f"{current_word.norwegian if session['exercise_type'] == 'eng_to_nor' else current_word.english_meanings}. "
            f"Mnemonic: {current_word.mnemonic}"
        )
        session['current_index'] = current_index + 1

    return render_template(
        'exercise.html',
        word=current_word,
        exercise_type=session['exercise_type'],
        feedback=feedback
    )

@main_blueprint.route('/round_summary')
def round_summary():
    return render_template('round_summary.html')

@main_blueprint.route('/vocab_list')
def vocab_list():
    words = Verb.query.all()

    def get_percentage(word):
        if word.total_attempts == 0:
            return None
        return word.correct_attempts / word.total_attempts

    # Sort tested verbs by percentage (lowest first) and put untested at the bottom
    words = sorted(words, key=lambda w: (get_percentage(w) is None, get_percentage(w) if get_percentage(w) is not None else 0))
    return render_template('vocab_list.html', words=words)

