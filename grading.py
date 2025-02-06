# grading.py
import os
import openai

# Make sure your OPENAI_API_KEY is set in your environment variables.
openai.api_key = os.getenv("OPENAI_API_KEY")

def grade_free_form_answer(user_answer, correct_answers):
    """
    Use an LLM to determine if the user's answer matches one of the acceptable answers.
    """
    prompt = (
        f"The acceptable answers for a Norwegian verb are: {', '.join(correct_answers)}.\n"
        f"The user answered: '{user_answer}'.\n"
        "Does the user answer match one of the acceptable meanings? Answer with 'yes' or 'no'."
    )
    try:
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=5,
            temperature=0.0
        )
        answer = response.choices[0].text.strip().lower()
        return answer.startswith("yes")
    except Exception as e:
        print("Error during grading:", e)
        # Fallback: simple fuzzy matching
        return any(ans.lower() in user_answer.lower() for ans in correct_answers)
