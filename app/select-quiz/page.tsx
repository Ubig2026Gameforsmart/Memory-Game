import { quizApi, Quiz } from "@/lib/supabase"
import SelectQuizContent from "./SelectQuizContent"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Select Quiz | Memory Quiz",
  description: "Browse and select from hundreds of educational and fun quizzes.",
}

// 🚀 SERVER-SIDE RENDERING (SSR): Fetch initial quizzes on the server
export default async function SelectQuizPage() {
  let initialQuizzes: Quiz[] = []
  let initialTotalCount = 0
  let initialTotalPages = 1

  try {
    // Fetch the first page of quizzes (matching itemsPerPage = 10)
    const result = await quizApi.getQuizzesPaginated({
      page: 1,
      limit: 10
    })

    initialQuizzes = result.quizzes
    initialTotalCount = result.totalCount
    initialTotalPages = result.totalPages
    
    console.log(`[SSR] Successfully pre-loaded ${initialQuizzes.length} quizzes from server side.`)
  } catch (error) {
    console.error("[SSR] Error fetching initial quizzes:", error)
    // Fallback to empty state, SelectQuizContent handles client-side retry
  }

  return (
    <SelectQuizContent 
      initialQuizzes={initialQuizzes}
      initialTotalCount={initialTotalCount}
      initialTotalPages={initialTotalPages}
    />
  )
}