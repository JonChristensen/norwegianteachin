from flask import Blueprint, jsonify, render_template, request, redirect, url_for
from flask_login import login_required, current_user
from models import db, Verb, UserVerbProgress
from grading import generate_context_for_verb
# Define Blueprint
main_blueprint = Blueprint('main', __name__)

from flask import current_app
from flask_login import current_user
from flask import session
import random

@main_blueprint.route('/')
def index():
    session.get('test')
    if current_user.is_authenticated:
        current_app.logger.info(f"Current user: {current_user.email}")
    else:
        current_app.logger.info("No user is logged in.")
    return render_template('index.html')

@main_blueprint.route('/get_context/<int:verb_id>', methods=['GET'])
@login_required
def get_context(verb_id):
    # Set a flag indicating that the user requested context for this exercise.
    session["context_requested"] = True

    verb = Verb.query.get(verb_id)
    if not verb:
        return jsonify({"error": "Verb not found"}), 404
    
    context = generate_context_for_verb(verb)
    return jsonify({"context": context})


@main_blueprint.route('/exercise')
@login_required
def exercise():
    user_id = current_user.id
    words = Verb.query.all()

    # Intelligent exercise selection
    untested = []
    needs_improvement = []
    mastered = []

    for word in words:
        progress = UserVerbProgress.query.filter_by(user_id=user_id, verb_id=word.id).first()
        if not progress:
            untested.append(word)
        elif (progress.correct_attempts / progress.total_attempts) < 0.7:
            needs_improvement.append(word)
        else:
            mastered.append(word)

    if untested:
        next_word = random.choice(untested)
    elif needs_improvement:
        next_word = random.choice(needs_improvement)
    else:
        next_word = random.choice(words)

    # For now, we set exercise_type to a default value
    exercise_type = 'nor_to_eng'
    return render_template('exercise.html', verb=next_word, exercise_type=exercise_type)

@main_blueprint.route('/submit_answer', methods=['POST'])
@login_required
def submit_answer():
    user_id = current_user.id
    verb_id = request.form['verb_id']
    user_answer = request.form['user_answer']
    verb = Verb.query.get(verb_id)
    
    # Check if the user requested context for this exercise.
    # Using pop() so that the flag is removed after processing.
    context_requested = session.pop("context_requested", False)
    
    if context_requested:
        # If context was requested, do not count this attempt as correct.
        is_correct = False
    else:
        # Otherwise, grade the answer normally using the LLM-based function.
        # (Assuming verb.english_meanings is a comma-separated string)
        is_correct = grade_free_form_answer(user_answer, verb.english_meanings.split(","))
    
    # Fetch or create the user's progress record for this verb.
    progress = UserVerbProgress.query.filter_by(user_id=user_id, verb_id=verb.id).first()
    if not progress:
        progress = UserVerbProgress(user_id=user_id, verb_id=verb.id, total_attempts=0, correct_attempts=0)
        db.session.add(progress)
    
    progress.total_attempts += 1
    if is_correct:
        progress.correct_attempts += 1
    
    db.session.commit()
    
    # Prepare a feedback message.
    if context_requested:
        feedback = "You got a hint for this exercise; this attempt will not count as correct."
    else:
        if is_correct:
            feedback = "Correct!"
        else:
            feedback = "Incorrect. The correct answer is: " + verb.english_meanings
    
    # Render a review page so the user can see the question, their answer, and the feedback.
    return render_template('exercise_review.html', verb=verb, user_answer=user_answer, feedback=feedback)


@main_blueprint.route('/vocab_list')
@login_required
def vocab_list():
    user_id = current_user.id
    words = Verb.query.all()
    word_progress = []

    for word in words:
        progress = UserVerbProgress.query.filter_by(user_id=user_id, verb_id=word.id).first()
        if progress and progress.total_attempts > 0:
            percentage = (progress.correct_attempts / progress.total_attempts) * 100
        else:
            percentage = None
        # Append a tuple with all necessary data
        word_progress.append((word, progress, percentage))

    # Sort the list: untested words (percentage is None) go to the bottom,
    # then sorted by percentage (you can adjust this order as desired)
    word_progress = sorted(word_progress, key=lambda x: (x[2] is None, x[2] if x[2] is not None else 0))

    return render_template('vocab_list.html', words=word_progress)