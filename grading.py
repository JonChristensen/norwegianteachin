# grading.py
import os
import openai

# Make sure your OPENAI_API_KEY is set in your environment variables.
openai.api_key = os.getenv("OPENAI_API_KEY")

def expand_answers(correct_answers):
    expanded = []
    for ans in correct_answers:
        parts = [part.strip() for part in ans.split("/")]
        expanded.extend(parts)
    return expanded

def grade_free_form_answer(user_answer, correct_answers):
    expanded_answers = expand_answers(correct_answers)
    prompt = (
        f"The acceptable answers for a Norwegian verb are: {', '.join(expanded_answers)}.\n"
        f"The user's answer is: '{user_answer}'.\n"
        "Does the user's answer match one of the acceptable meanings exactly? Respond with only 'yes' or 'no'."
    )
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert language tutor who responds with only 'yes' or 'no'."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=5,
            temperature=0.0,
        )
        answer = response.choices[0].message.content.strip().lower()
        return answer.startswith("yes")
    except Exception as e:
        print("Error during grading:", e)
        return any(ans.lower() == user_answer.strip().lower() for ans in expanded_answers)

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
