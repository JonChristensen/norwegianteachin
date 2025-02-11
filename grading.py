import os
import openai

# Ensure your OPENAI_API_KEY is set in your environment variables.
openai.api_key = os.getenv("OPENAI_API_KEY")

def expand_answers(correct_answers):
    """
    Split each acceptable answer on the '/' delimiter and trim whitespace.
    For example, "to insert / install" becomes ["to insert", "install"].
    """
    expanded = []
    for ans in correct_answers:
        parts = [part.strip() for part in ans.split("/")]
        expanded.extend(parts)
    return expanded

def grade_free_form_answer(user_answer, correct_answers):
    """
    Use OpenAI's ChatCompletion API to determine if the user's answer is acceptable.
    This version adjusts the prompt to instruct the model to ignore extra words like "to"
    if the core meaning matches.
    """
    expanded_answers = expand_answers(correct_answers)
    
    # Construct the prompt. Note that we explicitly instruct the model to ignore words like "to".
    prompt = (
        f"The acceptable answers for the Norwegian verb are: {', '.join(expanded_answers)}.\n"
        f"The user's answer is: '{user_answer}'.\n"
        "Determine if the user's answer is an acceptable match to one of the acceptable meanings. "
        "If the user's answer contains extra words (e.g., a leading 'to') but the core word matches, "
        "consider it acceptable. Respond with only 'yes' or 'no'."
    )
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert language tutor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=5,
            temperature=0.0,
        )
        answer = response.choices[0].message.content.strip().lower()
        return answer.startswith("yes")
    except Exception as e:
        print("Error during grading:", e)
        # Fallback: use a simple check that ignores a leading "to " if present.
        normalized_user = user_answer.strip().lower()
        # Remove a leading "to " if it exists
        if normalized_user.startswith("to "):
            normalized_user = normalized_user[3:]
        for ans in expanded_answers:
            normalized_ans = ans.strip().lower()
            if normalized_ans.startswith("to "):
                normalized_ans = normalized_ans[3:]
            if normalized_user == normalized_ans:
                return True
        return False

def generate_context_for_verb(verb):
    prompt = (
        f"Provide a concise explanation, an example sentence, and a mnemonic to help a student remember "
        f"the Norwegian verb '{verb.norwegian}'. The common English meanings are: {verb.english_meanings}.\n"
        "Keep your answer short and clear."
    )
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert language tutor who provides helpful context."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=100,
            temperature=0.7,
        )
        context = response.choices[0].message.content.strip()
        return context
    except Exception as e:
        print("Error generating context:", e)
        return "No additional context is available at this time."
