import { redirect } from "next/navigation"

export default function ExerciseRedirect() {
  redirect("/exercise/random")
  return null
} 