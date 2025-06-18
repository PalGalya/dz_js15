const moviesListElement = document.getElementById('movies-list')
const searchInput = document.getElementById('search')
const searchCheckbox = document.getElementById('checkbox')
const prevButton = document.getElementById('prev-page')
const nextButton = document.getElementById('next-page')
const currentPageSpan = document.getElementById('current-page')
const totalPagesSpan = document.getElementById('total-pages')
const paginationBlock = document.getElementById('pagination')

const ITEMS_PER_PAGE = 10
const API_KEY = '18b8609f'

let lastSearchValue = ''
let currentPage = 1
let totalResults = 0
let isSearchTriggerEnabled = false

// Спочатку ховаємо пагінацію
paginationBlock.style.display = 'none'

const debounceTime = (() => {
  let timerId = null
  return (cb, ms) => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
    timerId = setTimeout(cb, ms)
  }
})()

const addMovieToList = ({ Poster: poster, Title: title, Year: year }) => {
  const item = document.createElement('div')
  item.classList.add('movie')

  const image = document.createElement('img')
  image.classList.add('movie__poster')

  image.src = 'assets/img/no-image.png'

  // Пробуємо завантажити постер, якщо він доступний
  if (poster && poster !== 'N/A') {
    const testImage = new Image()
    testImage.onload = function () {
      image.src = this.src
    }
    testImage.src = poster
  }

  image.alt = `${title} ${year}`
  image.title = `${title} ${year}`

  item.append(image)

  const titleElement = document.createElement('div')
  titleElement.classList.add('movie__title')
  titleElement.textContent = title

  const yearElement = document.createElement('div')
  yearElement.classList.add('movie__year')
  yearElement.textContent = year

  item.appendChild(titleElement)
  item.appendChild(yearElement)

  moviesListElement.prepend(item)
}

const clearMoviesMarkup = () => {
  if (moviesListElement) moviesListElement.innerHTML = ''
}

const updatePaginationInfo = (show = true) => {
  // Показуємо пагінацію тільки якщо є результати
  paginationBlock.style.display = show && totalResults > 0 ? 'flex' : 'none'

  if (!show || totalResults === 0) return

  const totalPages = Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE))

  currentPageSpan.textContent = currentPage
  totalPagesSpan.textContent = totalPages

  prevButton.disabled = currentPage <= 1
  nextButton.disabled = currentPage >= totalPages
}

const showMessage = (message, isError = false) => {
  const messageElement = document.createElement('div')
  messageElement.classList.add(isError ? 'error-message' : 'no-results')
  messageElement.textContent = message
  moviesListElement.appendChild(messageElement)
}

const fetchMovies = async (searchValue, page = 1) => {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(searchValue)}&page=${page}`
    )

    if (!response.ok) {
      throw new Error(`Помилка HTTP: ${response.status}`)
    }

    const data = await response.json()

    if (data.Response === 'False') {
      return {
        movies: [],
        totalResults: 0,
        error: data.Error || 'Фільми не знайдено'
      }
    }

    return {
      movies: data.Search || [],
      totalResults: parseInt(data.totalResults) || 0
    }
  } catch (error) {
    console.error('Помилка при пошуку фільмів:', error)
    return {
      movies: [],
      totalResults: 0,
      error: error.message
    }
  }
}

const searchMovies = async (searchValue, page = 1) => {
  if (!searchValue || searchValue.length < 4) {
    updatePaginationInfo(false)
    return
  }

  clearMoviesMarkup()
  const loadingElement = document.createElement('div')
  loadingElement.classList.add('loading')
  loadingElement.textContent = 'Завантаження...'
  moviesListElement.appendChild(loadingElement)

  const result = await fetchMovies(searchValue, page)

  clearMoviesMarkup()

  if (result.error) {
    showMessage(result.error, true)
    updatePaginationInfo(false)
  } else if (result.movies.length === 0) {
    showMessage('Фільми не знайдено. Спробуйте змінити запит.')
    updatePaginationInfo(false)
  } else {
    result.movies.forEach(addMovieToList)
    lastSearchValue = searchValue
    currentPage = page
    totalResults = result.totalResults
    updatePaginationInfo(true)
  }
}

const inputSearchHandler = (e) => {
  debounceTime(() => {
    const searchValue = e.target.value.trim()

    if (!searchValue || searchValue.length < 4) {
      clearMoviesMarkup()
      updatePaginationInfo(false)
      return
    }

    currentPage = 1

    if (!isSearchTriggerEnabled) {
      clearMoviesMarkup()
    }

    searchMovies(searchValue, currentPage)
  }, 2000)
}

prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--
    searchMovies(lastSearchValue, currentPage)
  }
})

nextButton.addEventListener('click', () => {
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE)
  if (currentPage < totalPages) {
    currentPage++
    searchMovies(lastSearchValue, currentPage)
  }
})

searchInput.addEventListener('input', inputSearchHandler)

searchCheckbox.addEventListener('change', (e) => {
  isSearchTriggerEnabled = e.target.checked
})

updatePaginationInfo(false)
