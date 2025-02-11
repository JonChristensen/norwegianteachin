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
    This version normalizes answers by removing a leading 'to ' and then compares the core meanings.
    """
    # Expand the correct answers
    expanded_answers = expand_answers(correct_answers)
    
    # Normalize acceptable answers: remove a leading "to " if present and lowercase
    normalized_answers = []
    for ans in expanded_answers:
        norm = ans.strip().lower()
        if norm.startswith("to "):
            norm = norm[3:]
        normalized_answers.append(norm)
    
    # Normalize the user's answer similarly
    normalized_user = user_answer.strip().lower()
    if normalized_user.startswith("to "):
        normalized_user = normalized_user[3:]
    
    # Construct a detailed prompt that shows both the original and normalized answers.
    prompt = (
        f"The acceptable answers for the Norwegian verb are: {', '.join(expanded_answers)}.\n"
        f"After normalizing (by removing a leading 'to ' if present and lowercasing), "
        f"the acceptable answers are: {', '.join(normalized_answers)}.\n"
        f"The user's answer is: '{user_answer}', which normalizes to '{normalized_user}'.\n"
        "Determine if the normalized user's answer exactly matches one of the normalized acceptable answers.\n"
        "Respond with only 'yes' or 'no'."
    )
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert language tutor who only responds with 'yes' or 'no'."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=5,
            temperature=0.0,
        )
        answer = response.choices[0].message.content.strip().lower()
        return answer.startswith("yes")
    except Exception as e:
        print("Error during grading:", e)
        # Fallback: perform direct normalized comparison.
        return normalized_user in normalized_answers

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
