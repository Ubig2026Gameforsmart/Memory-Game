"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Check, ChevronUp, ChevronDown, Heart, User, Clock, Book, BookOpen, Beaker, Calculator, Globe, Languages, Laptop, Dumbbell, Film, Briefcase, ChevronLeft, ChevronRight, Loader2, Users, RefreshCw, Ghost, Play, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuizzes, useQuizzesPaginated, preloadCategoryImages } from "@/hooks/use-quiz"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import { supabase, quizApi, Quiz } from "@/lib/supabase"
import { CachedImage } from "@/components/cached-image"

// Categories and background images mapping (Moved from page.tsx)
const categories = [
  {
    value: "all",
    label: "All Categories",
    icon: <Book className="h-4 w-4 text-blue-500" />,
    bgImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80",
  },
  {
    value: "general",
    label: "General",
    icon: <BookOpen className="h-4 w-4" />,
    bgImage: "https://images.unsplash.com/photo-1707926310424-f7b837508c40?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "science",
    label: "Science",
    icon: <Beaker className="h-4 w-4 text-green-500" />,
    bgImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "math",
    label: "Mathematics",
    icon: <Calculator className="h-4 w-4 text-red-500" />,
    bgImage: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "history",
    label: "History",
    icon: <Clock className="h-4 w-4 text-yellow-500" />,
    bgImage: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80",
  },
  {
    value: "geography",
    label: "Geography",
    icon: <Globe className="h-4 w-4 text-teal-500" />,
    bgImage: "https://images.unsplash.com/photo-1592252032050-34897f779223?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "language",
    label: "Language",
    icon: <Languages className="h-4 w-4 text-purple-500" />,
    bgImage: "https://images.unsplash.com/photo-1620969427101-7a2bb6d83273?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "technology",
    label: "Technology",
    icon: <Laptop className="h-4 w-4 text-blue-500" />,
    bgImage: "https://plus.unsplash.com/premium_photo-1661963874418-df1110ee39c1?q=80&w=1086&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "sports",
    label: "Sports",
    icon: <Dumbbell className="h-4 w-4 text-orange-500" />,
    bgImage: "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    icon: <Film className="h-4 w-4 text-pink-500" />,
    bgImage: "https://images.unsplash.com/photo-1470020618177-f49a96241ae7?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "business",
    label: "Business",
    icon: <Briefcase className="h-4 w-4 text-indigo-500" />,
    bgImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80",
  },
];

interface SelectQuizContentProps {
  initialQuizzes?: Quiz[]
  initialTotalCount?: number
  initialTotalPages?: number
}

export default function SelectQuizContent({ 
  initialQuizzes = [], 
  initialTotalCount = 0, 
  initialTotalPages = 1 
}: SelectQuizContentProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isSelectAllExpanded, setIsSelectAllExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 
  const [favoriteQuizIds, setFavoriteQuizIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"quiz" | "my-quiz" | "favorite">("quiz")
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null)
  const [myQuizzes, setMyQuizzes] = useState<any[]>([])
  const [loadingMyQuizzes, setLoadingMyQuizzes] = useState(false)

  // Fetch quizzes with server-side pagination support
  const {
    quizzes: paginatedQuizzes,
    totalCount: paginatedTotalCount,
    totalPages: paginatedTotalPages,
    loading: paginatedLoading,
    error: paginatedError
  } = useQuizzesPaginated({
    page: currentPage,
    limit: itemsPerPage,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    searchQuery: searchTerm || undefined,
    enabled: activeTab === "quiz" 
  })

  // Use initial quizzes if it's the first load and we don't have fresh data yet
  const displayPaginatedQuizzes = (currentPage === 1 && searchTerm === "" && categoryFilter === "all" && paginatedQuizzes.length === 0) 
    ? initialQuizzes 
    : paginatedQuizzes

  const { quizzes: allQuizzes, loading: allQuizzesLoading } = useQuizzes()

  const getCategoryBgImage = (category: string) => {
    const categoryLower = category?.toLowerCase() || 'general';
    const categoryData = categories.find(cat => cat.value === categoryLower || cat.label.toLowerCase() === categoryLower);
    return categoryData?.bgImage || categories[1].bgImage;
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category?.toLowerCase() || 'general';
    const categoryData = categories.find(cat => cat.value === categoryLower || cat.label.toLowerCase() === categoryLower);
    return categoryData?.icon || categories[1].icon;
  };

  const getCategoryColor = (category: string | undefined): string => {
    if (!category) return 'bg-blue-500';
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
      case 'general': return 'bg-blue-500';
      case 'science': return 'bg-green-500';
      case 'mathematics': case 'math': return 'bg-red-500';
      case 'history': return 'bg-yellow-500';
      case 'geography': return 'bg-teal-500';
      case 'language': return 'bg-purple-500';
      case 'technology': return 'bg-blue-500';
      case 'sports': return 'bg-orange-500';
      case 'entertainment': return 'bg-pink-500';
      case 'business': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getQuizBackgroundImage = (quiz: any): string => {
    if (!quiz) return getCategoryBgImage('general');
    const img = quiz.image_url || quiz.imageUrl || quiz.cover_image || quiz.coverImage || 
                quiz.banner_image || quiz.bannerImage || quiz.thumbnail || quiz.thumbnailUrl ||
                quiz.metadata?.image_url || quiz.metadata?.cover_image;
    return img || getCategoryBgImage(quiz.category || 'General');
  };

  const normalizeCategory = (category: string | undefined | null): string => {
    if (!category) return 'General'
    const categoryLower = category.toLowerCase().trim()
    const categoryMap: { [key: string]: string } = {
      'general': 'General', 'science': 'Science', 'mathematics': 'Mathematics', 'math': 'Mathematics',
      'history': 'History', 'geography': 'Geography', 'language': 'Language', 'technology': 'Technology',
      'sports': 'Sports', 'entertainment': 'Entertainment', 'business': 'Business'
    }
    return categoryMap[categoryLower] || 'General'
  }

  const translateCategory = (category: string | undefined) => {
    if (!category) return t('selectQuiz.categories.general')
    const categoryLower = category.toLowerCase()
    const categoryMap: { [key: string]: string } = {
      'general': 'general', 'science': 'science', 'mathematics': 'mathematics', 'math': 'mathematics',
      'history': 'history', 'geography': 'geography', 'language': 'language', 'technology': 'technology',
      'sports': 'sports', 'entertainment': 'entertainment', 'business': 'business'
    }
    const mappedCategory = categoryMap[categoryLower] || 'general'
    return t(`selectQuiz.categories.${mappedCategory}`)
  }

  const executeSearch = () => setSearchTerm(searchInput)
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") executeSearch() }

  useEffect(() => {
    const categoryImageUrls = categories.map(cat => cat.bgImage).filter((url): url is string => !!url)
    preloadCategoryImages(categoryImageUrls)
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchUserProfileAndFavorites = async (providedUserId?: string | null) => {
      try {
        const targetUserId = providedUserId ?? (await supabase.auth.getUser()).data.user?.id
        if (!targetUserId) {
          if (isMounted) { setFavoriteQuizIds([]); setCurrentUserProfileId(null); }
          return
        }
        const { data, error } = await supabase.from("profiles").select("id, favorite_quiz").eq("auth_user_id", targetUserId).single()
        if (error) throw error
        const favorites = Array.isArray(data?.favorite_quiz?.favorites) ? data.favorite_quiz.favorites : []
        if (isMounted) { setCurrentUserProfileId(data?.id || null); setFavoriteQuizIds(favorites); }
      } catch (err) { console.error("Error fetching user profile:", err) }
    }
    fetchUserProfileAndFavorites()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfileAndFavorites(session?.user?.id ?? null)
    })
    return () => { isMounted = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!currentUserProfileId) { setMyQuizzes([]); return }
    const fetchMyQuizzes = async () => {
      try {
        setLoadingMyQuizzes(true)
        const userQuizzes = await quizApi.getQuizzesByCreator(currentUserProfileId!)
        setMyQuizzes(userQuizzes)
      } catch (err) { console.error("Error fetching my quizzes:", err) }
      finally { setLoadingMyQuizzes(false) }
    }
    fetchMyQuizzes()
  }, [currentUserProfileId])

  const filteredQuizzesForClientPagination = useMemo(() => {
    let tabFilteredQuizzes: any[] = []
    if (activeTab === "my-quiz") tabFilteredQuizzes = myQuizzes
    else if (activeTab === "favorite") {
      const favorites = [...allQuizzes, ...myQuizzes].filter(quiz => favoriteQuizIds.includes(quiz.id))
      tabFilteredQuizzes = favorites.filter((quiz, index, self) => index === self.findIndex((q) => q.id === quiz.id))
    } else return []

    return tabFilteredQuizzes.filter((quiz) => {
      const matchesSearch = searchTerm === "" || quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
      let matchesCategory = true
      if (categoryFilter !== "all") {
        matchesCategory = normalizeCategory(quiz.category) === normalizeCategory(categoryFilter)
      }
      return matchesSearch && matchesCategory
    })
  }, [allQuizzes, myQuizzes, searchTerm, categoryFilter, activeTab, favoriteQuizIds])

  const isServerPaginated = activeTab === "quiz"
  const totalPages = isServerPaginated ? paginatedTotalPages : Math.ceil(filteredQuizzesForClientPagination.length / itemsPerPage)

  const currentQuizzes = useMemo(() => {
    if (isServerPaginated) return displayPaginatedQuizzes
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredQuizzesForClientPagination.slice(startIndex, startIndex + itemsPerPage)
  }, [isServerPaginated, displayPaginatedQuizzes, filteredQuizzesForClientPagination, currentPage])

  const loading = isServerPaginated ? paginatedLoading : (activeTab === "my-quiz" ? loadingMyQuizzes : allQuizzesLoading)

  useEffect(() => { setCurrentPage(1) }, [searchTerm, categoryFilter, activeTab])

  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    if (totalPages <= maxVisiblePages) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1), end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      if (totalPages > 1) pages.push(totalPages)
    }
    return pages
  }

  const handlePreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const handlePageClick = (pageNumber: number) => setCurrentPage(pageNumber)

  const handleQuizSelect = (quizId: string) => {
    localStorage.setItem("selectedQuizId", quizId)
    router.push("/quiz-settings")
  }

  const toggleFavorite = async (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUserProfileId) return
    const isFavorite = favoriteQuizIds.includes(quizId)
    const updatedFavorites = isFavorite ? favoriteQuizIds.filter(id => id !== quizId) : [...favoriteQuizIds, quizId]
    const { error } = await supabase.from("profiles").update({ favorite_quiz: { favorites: updatedFavorites } }).eq("id", currentUserProfileId)
    if (!error) setFavoriteQuizIds(updatedFavorites)
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      <div className="absolute inset-0 opacity-20"><div className="pixel-grid"></div></div>
      <div className="absolute inset-0 opacity-10"><div className="scanlines"></div></div>
      <div className="absolute inset-0 overflow-hidden"><PixelBackgroundElements /></div>

      <div className="relative z-10 container mx-auto px-4 pt-0 pb-4 sm:pb-8">
        <div className="relative flex items-center justify-between gap-2 sm:gap-4 mb-0.5 sm:mb-1 pt-0">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/">
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <Button variant="outline" className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 h-8 w-8 p-0">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 ">
              <img draggable={false} src="/images/memoryquizv4.webp" alt="Memory Quiz" className="h-6 sm:h-8 md:h-10 lg:h-12 xl:h-16 w-auto -mt-2 filter-drop-shadow" />
            </div>
          </div>
          <div className="flex-shrink-0 -mt-1 sm:-mt-6">
            <img draggable={false} src="/images/gameforsmartlogo.webp" alt="GameForSmart Logo" className="h-7 sm:h-9 md:h-11 lg:h-13 xl:h-16 w-auto filter-drop-shadow" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-[-5px] sm:mt-[-10px]">
          <div className="mb-4 sm:mb-5 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
            {/* Search and Category Row (Now on the Left) */}
            <div className="flex flex-1 items-center gap-2 sm:gap-3 order-2 lg:order-1">
              <div className="relative flex-1 group">
                <Input placeholder={t('selectQuiz.searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearch} className="pl-10 sm:pl-12 h-10 bg-white border-2 border-black rounded-none shadow-lg text-black placeholder:text-gray-500 placeholder:text-[9px] sm:placeholder:text-[10px] placeholder:pixel-font focus:border-blue-600 w-full" />
                <Button onClick={executeSearch} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 bg-blue-500 hover:bg-blue-600 text-white font-bold border-2 border-black opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible">
                  <span className="hidden sm:inline pixel-font text-[10px]">Search</span>
                  <Search className="sm:hidden h-3 w-3 text-white" />
                </Button>
              </div>

              <div className="w-36 sm:w-44 lg:w-48 xl:w-56 relative shrink-0">
                <Button onClick={() => setIsSelectAllExpanded(!isSelectAllExpanded)} className="w-full h-10 bg-white border-2 border-black rounded-none shadow-lg text-black hover:bg-gray-100 flex items-center justify-between px-2 sm:px-3">
                  <div className="flex items-center">
                    <div className="w-3.5 h-3.5 mr-1.5">{getCategoryIcon(categoryFilter)}</div>
                    <span className="font-bold text-[6.5px] sm:text-[7.5px] xl:text-[8.5px] truncate max-w-[85px] sm:max-w-none pixel-font leading-none">{categoryFilter === "all" ? t('selectQuiz.allCategories') : translateCategory(categoryFilter)}</span>
                  </div>
                  {isSelectAllExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                {isSelectAllExpanded && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-black shadow-lg mt-1 max-h-[220px] overflow-y-auto">
                    {categories.map((cat) => (
                      <button key={cat.value} onClick={() => { setCategoryFilter(cat.value); setIsSelectAllExpanded(false) }} className={`w-full text-left px-3 py-2 text-[8px] xl:text-[9px] pixel-font hover:bg-gray-200 flex items-center justify-between h-11 ${categoryFilter === cat.value ? "bg-gray-200" : ""}`}>
                        <div className="flex items-center justify-center gap-2"><div className="w-3.5 h-3.5">{cat.icon}</div><span>{cat.label}</span></div>
                        {categoryFilter === cat.value && <Check className="h-4 w-4 text-green-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs Section (Toggleable) */}
            <div className="flex gap-2 shrink-0 order-1 lg:order-2">
              <TabButton 
                active={activeTab === "my-quiz"} 
                onClick={() => setActiveTab(activeTab === "my-quiz" ? "quiz" : "my-quiz")} 
                icon={<User className="h-4 w-4 sm:hidden" />} label={t('selectQuiz.tabs.myQuiz')} 
              />
              <TabButton 
                active={activeTab === "favorite"} 
                onClick={() => setActiveTab(activeTab === "favorite" ? "quiz" : "favorite")} 
                icon={<Heart className="h-4 w-4 text-pink-500" fill={activeTab === "favorite" ? "currentColor" : "none"} />} label={t('selectQuiz.tabs.favorite')} 
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
              {[...Array(10)].map((_, i) => (
                <QuizCardSkeleton key={i} />
              ))}
            </div>
          ) : currentQuizzes.length === 0 ? (
            <div className="py-24 px-4 text-center">
              <div className="flex flex-col items-center">
                <div className="relative mb-14">
                  <div className="absolute inset-0 bg-cyan-400/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                  
                  {/* Scattered Empty Cards Background */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Card 1 - Back left */}
                    <div className="absolute -translate-x-20 -translate-y-8 -rotate-12 w-16 h-24 border-2 border-dashed border-cyan-500/20 rounded-lg bg-cyan-500/5 animate-float shadow-inner"></div>
                    {/* Card 2 - Top right */}
                    <div className="absolute translate-x-16 -translate-y-16 rotate-12 w-14 h-20 border-2 border-dashed border-blue-500/20 rounded-lg bg-blue-500/5 animate-float-delayed shadow-inner"></div>
                    {/* Card 3 - Bottom left */}
                    <div className="absolute -translate-x-16 translate-y-12 rotate-[-45deg] w-12 h-18 border-2 border-dashed border-indigo-500/20 rounded-lg bg-indigo-500/5 animate-float shadow-inner"></div>
                    {/* Card 4 - Right bottom */}
                    <div className="absolute translate-x-20 translate-y-10 rotate-[15deg] w-16 h-24 border-2 border-dashed border-cyan-500/20 rounded-lg bg-cyan-500/5 animate-float-delayed shadow-inner"></div>
                  </div>

                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Floating rings */}
                    <div className="absolute inset-2 border-2 border-dashed border-cyan-500/30 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-8 border-2 border-dashed border-blue-500/20 rounded-full animate-spin-reverse-slow"></div>
                    
                    {/* Ghost Icon */}
                    <div className="relative bg-black/60 backdrop-blur-xl rounded-full w-28 h-28 border-4 border-black flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.3)] animate-float-slow outline outline-2 outline-cyan-500/40">
                      <Ghost className="h-14 w-14 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                      
                      {/* Pixel particles */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-400 rotate-45 animate-bounce opacity-50"></div>
                      <div className="absolute top-1/4 -right-1.5 w-2 h-2 bg-blue-400 animate-float-delayed opacity-70"></div>
                      <div className="absolute bottom-1/4 -left-1.5 w-3 h-3 bg-indigo-400 animate-float opacity-60"></div>
                    </div>
                    
                    {/* Badge */}
                    <div className="absolute top-2 -right-1 w-10 h-10 bg-red-600 border-4 border-black text-white rounded-lg flex items-center justify-center font-black text-lg shadow-[6px_6px_0px_rgba(0,0,0,1)] animate-pulse rotate-12">
                      ?
                    </div>
                  </div>
                </div>

                <div className="px-4">
                  <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-8 tracking-normal uppercase pixel-font">
                    QUIZ NOT FOUND!
                  </h3>
                </div>

                <Button 
                  onClick={() => {setSearchInput(""); setSearchTerm(""); setCategoryFilter("all"); setActiveTab("quiz")}}
                  className="group/btn h-12 px-10 bg-cyan-500 hover:bg-cyan-400 text-black font-black border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <span className="flex items-center gap-2 pixel-font text-[10px]">
                    RESET FILTER
                    <RefreshCw className="h-4 w-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
                {currentQuizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} isFavorite={favoriteQuizIds.includes(quiz.id)} onToggleFavorite={toggleFavorite} onSelect={handleQuizSelect} getCategoryColor={getCategoryColor} getQuizBackgroundImage={getQuizBackgroundImage} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 sm:mt-12 mb-8">
                  <PaginationButton onClick={handlePreviousPage} disabled={currentPage === 1} icon={<ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />} />
                  <div className="flex gap-1 sm:gap-2">
                    {generatePageNumbers().map((page, i) => (
                      page === '...' ? <span key={`ellipsis-${i}`} className="px-2 py-2 text-white">...</span> :
                      <button key={`page-${page}`} onClick={() => handlePageClick(Number(page))} className={`w-8 h-8 sm:w-10 sm:h-10 border-2 border-black font-bold text-[10px] sm:text-xs transition-all pixel-font ${currentPage === page ? "bg-blue-500 text-white" : "bg-white text-black hover:bg-gray-100"}`}>{page}</button>
                    ))}
                  </div>
                  <PaginationButton onClick={handleNextPage} disabled={currentPage === totalPages} icon={<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`px-4 sm:px-6 py-2 sm:py-3 border-2 border-black font-bold text-[9px] sm:text-[10px] transition-all duration-200 min-h-[44px] shadow-lg flex items-center justify-center gap-1 sm:gap-2 pixel-font ${active ? "bg-blue-500 text-white" : "bg-white text-black hover:bg-gray-100"}`}>
      {icon} <span className={icon ? "hidden sm:inline" : ""}>{label}</span>
    </button>
  )
}

function QuizCard({ quiz, isFavorite, onToggleFavorite, onSelect, getCategoryColor, getQuizBackgroundImage }: any) {
  return (
    <div onClick={() => onSelect(quiz.id)} className="group relative bg-white border-2 border-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-pointer overflow-hidden aspect-[4/5] sm:aspect-[3/4]">
      <div className="absolute inset-0"><CachedImage src={getQuizBackgroundImage(quiz)} alt={quiz.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1.5">
        <div className={`px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/20 backdrop-blur-md ${getCategoryColor(quiz.category)}`}><div className="w-0.5 h-0.5 rounded-full bg-white animate-pulse"></div><span className="text-[5.5px] font-bold text-white uppercase tracking-wider pixel-font leading-none">{quiz.category || 'General'}</span></div>
      </div>
      <div onClick={(e) => onToggleFavorite(quiz.id, e)} className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-pink-500 transition-colors z-10 shadow-lg group/heart">
        <Heart 
          className={`h-5 w-5 transition-transform group-hover/heart:scale-125 ${isFavorite ? 'text-white' : ''}`} 
          fill={isFavorite ? "currentColor" : "none"} 
          strokeWidth={2.5}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-sm sm:text-base font-bold leading-tight mb-2 group-hover:text-blue-300 transition-colors line-clamp-2 cursor-help">{quiz.title}</h3>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="bg-slate-950 text-white border-2 border-white rounded-none shadow-[6px_6px_0px_rgba(0,0,0,1)] max-w-[280px] text-[10px] pixel-font p-3 animate-in zoom-in-90 duration-200"
            >
              <div className="relative">
                {quiz.title}
                <div className="absolute -bottom-4 left-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center justify-between gap-1 mt-1">
          <div className="flex items-center gap-1 text-[7px] sm:text-[8px] pixel-font text-white/90 transition-colors bg-white/10 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm shrink-0 uppercase"><HelpCircle className="h-2.5 w-2.5" /><span>{quiz.questions?.length || 0}</span></div>
          <div className="flex items-center gap-1 text-[7px] sm:text-[8px] pixel-font text-white/90 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm shrink-0 uppercase"><Play className="h-2.5 w-2.5 fill-current" /><span>{quiz.played || 0}</span></div>
        </div>
      </div>
    </div>
  )
}

function PaginationButton({ onClick, disabled, icon }: any) {
  return (
    <button onClick={onClick} disabled={disabled} className={`w-8 h-8 sm:w-10 sm:h-10 border-2 border-black flex items-center justify-center transition-all ${disabled ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-black hover:bg-gray-100 active:translate-y-0.5"}`}>
      {icon}
    </button>
  )
}

function QuizCardSkeleton() {
  return (
    <div className="bg-white/5 border-2 border-black/20 overflow-hidden aspect-[4/5] sm:aspect-[3/4] p-4 flex flex-col justify-end gap-3 animate-pulse">
      <div className="absolute top-2 left-2 w-20 h-5 bg-white/10 rounded-full"></div>
      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10"></div>
      <div className="w-full h-6 bg-white/20 mb-2"></div>
      <div className="w-2/3 h-6 bg-white/20 mb-4"></div>
      <div className="flex gap-2">
        <div className="w-20 h-4 bg-white/10"></div>
        <div className="w-20 h-4 bg-white/10"></div>
      </div>
    </div>
  )
}

function PixelBackgroundElements() {
  return (
    <>
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 animate-float opacity-60"></div>
      <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 animate-float-delayed opacity-70"></div>
      <div className="absolute bottom-32 left-1/4 w-5 h-5 bg-cyan-400 animate-float-slow opacity-50"></div>
      <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-pink-400 animate-float-delayed-slow opacity-60"></div>
      <div className="absolute top-1/2 left-20 w-4 h-4 bg-green-400 animate-float opacity-40"></div>
    </>
  )
}
