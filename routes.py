from flask import Blueprint, jsonify, render_template, request, redirect, url_for
from flask_login import login_required, current_user
from models import db, Verb, UserVerbProgress
from grading import grade_free_form_answer, generate_context_for_verb

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
    # Clear any previously set context flag so it doesn't carry over to a new exercise.
    session.pop("context_requested", None)

    user_id = current_user.id
    words = Verb.query.all()

    # Define available exercise types
    EXERCISE_TYPES = ['nor_to_eng', 'tenses', 'eng_to_nor']

    # Get exercise_type from query parameters
    exercise_type = request.args.get('exercise_type')

    # Update exercise mode if provided in query parameters
    if exercise_type:
        session['exercise_mode'] = exercise_type
    elif 'exercise_mode' not in session:
        session['exercise_mode'] = 'random'

    # Determine the current exercise type
    if session['exercise_mode'] == 'random':
        current_exercise = random.choice(EXERCISE_TYPES)
        current_app.logger.info(f"Randomly selected exercise type: {current_exercise}")
    else:
        current_exercise = session['exercise_mode']
        current_app.logger.info(f"Using selected exercise type: {current_exercise}")

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

    return render_template('exercise.html', 
                           verb=next_word, 
                           exercise_type=current_exercise,
                           current_mode=session['exercise_mode'])


@main_blueprint.route('/submit_answer', methods=['POST'])
@login_required
def submit_answer():
    user_id = current_user.id
    verb_id = request.form['verb_id']
    user_answer = request.form['user_answer']
    
    # Get the exercise type from the form if it was provided.
    exercise_type = request.form.get('exercise_type', None)
    
    # Retrieve the Verb object.
    verb = Verb.query.get(verb_id)
    
    # Pop the context_requested flag from the session.
    context_requested = session.pop("context_requested", False)
    
    # Initialize variables.
    is_correct = False
    feedback = ""
    
    # If context was requested, do not count the answer as correct.
    if context_requested:
        is_correct = False
        feedback = "You got a hint for this exercise; this attempt will not count as correct."
    else:
        # If an exercise type is provided, grade based on that type.
        if exercise_type:
            if exercise_type == 'nor_to_eng':
                # For Norwegian-to-English, compare against acceptable answers.
                is_correct = user_answer.strip().lower() in [
                    meaning.strip().lower() for meaning in verb.english_meanings.split(",")
                ]
                correct_answer = verb.english_meanings
            elif exercise_type == 'tenses':
                # For tenses, the expected answer is a comma-separated string of past and past participle.
                expected = f"{verb.past}, {verb.past_participle}".lower()
                is_correct = user_answer.strip().lower() == expected
                correct_answer = f"{verb.past}, {verb.past_participle}"
            else:  # eng_to_nor
                is_correct = user_answer.strip().lower() == verb.norwegian.lower()
                correct_answer = verb.norwegian

            if is_correct:
                feedback = "Correct!"
            else:
                feedback = f"Incorrect. The correct answer is: {correct_answer}"
        else:
            # Fallback: use the LLM-based grading function if no exercise_type is provided.
            is_correct = grade_free_form_answer(user_answer, verb.english_meanings.split(","))
            if is_correct:
                feedback = "Correct!"
            else:
                feedback = "Incorrect. The correct answer is: " + verb.english_meanings

    # Fetch or create the progress entry for this user and verb.
    progress = UserVerbProgress.query.filter_by(user_id=user_id, verb_id=verb.id).first()
    if not progress:
        progress = UserVerbProgress(user_id=user_id, verb_id=verb.id, total_attempts=0, correct_attempts=0)
        db.session.add(progress)
    
    progress.total_attempts += 1
    if is_correct:
        progress.correct_attempts += 1

    db.session.commit()
    
    # Render the review page with the question, user's answer, feedback, and the exercise type.
    return render_template('exercise_review.html', 
                           verb=verb, 
                           user_answer=user_answer, 
                           feedback=feedback,
                           exercise_type=exercise_type)

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