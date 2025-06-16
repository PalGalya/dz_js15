const moviesListElement = document.getElementById('movies-list')
const searchInput = document.getElementById('search')
const searchCheckbox = document.getElementById('checkbox')
const prevButton = document.getElementById('prev-page')
const nextButton = document.getElementById('next-page')
const currentPageSpan = document.getElementById('current-page')
const totalPagesSpan = document.getElementById('total-pages')

const ITEMS_PER_PAGE = 10
const API_KEY = '18b8609f'

let lastSearchValue = ''
let currentPage = 1
let totalResults = 0
let isSearchTriggerEnabled = false

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
  const image = document.createElement('img')

  item.classList.add('movie')

  image.classList.add('movie__poster')
  image.src = /^(https?:\/\/)/i.test(poster) ? poster : 'assets/img/no-image.png'
  image.alt = `${title} ${year}`
  image.title = `${title} ${year}`

  item.append(image)
  moviesListElement.prepend(item)
}

const getData = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.Search) throw new Error('The server returned incorrect data')
      return data.Search
    })
    .catch(console.log)

const clearMoviesMarkup = () => {
  if (moviesListElement) moviesListElement.innerHTML = ''
}

const updatePaginationInfo = () => {
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE)

  currentPageSpan.textContent = currentPage
  totalPagesSpan.textContent = totalPages

  prevButton.disabled = currentPage <= 1
  nextButton.disabled = currentPage >= totalPages
}

const searchMovies = (searchValue, page = 1) => {
  if (!searchValue || searchValue.length < 4) return

  if (!searchCheckbox.checked) {
    clearMoviesMarkup()
  }

  getData(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchValue}&page=${page}`)
    .then((movies) => {
      const response = fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchValue}&page=${page}`)
        .then((res) => res.json())
        .then((data) => {
          totalResults = parseInt(data.totalResults) || 0
          updatePaginationInfo()
        })

      movies.forEach(addMovieToList)
      lastSearchValue = searchValue
      currentPage = page
    })
    .catch((error) => {
      console.error('Ошибка при поиске фильмов:', error)
    })
}

const inputSearchHandler = (e) => {
  debounceTime(() => {
    const searchValue = e.target.value.trim()
    if (!searchValue || searchValue.length < 4 || searchValue === lastSearchValue) return

    currentPage = 1

    if (!isSearchTriggerEnabled) {
      clearMoviesMarkup()
    }

    getData(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchValue}&page=${currentPage}`)
      .then((movies) => {
        fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchValue}&page=${currentPage}`)
          .then((res) => res.json())
          .then((data) => {
            totalResults = parseInt(data.totalResults) || 0
            updatePaginationInfo()
          })

        movies.forEach(addMovieToList)
      })
      .catch((error) => console.error('Ошибка при поиске:', error))

    lastSearchValue = searchValue
  }, 2000)
}

prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--
    clearMoviesMarkup()
    searchMovies(lastSearchValue, currentPage)
  }
})

nextButton.addEventListener('click', () => {
  currentPage++
  clearMoviesMarkup()
  searchMovies(lastSearchValue, currentPage)
})

searchInput.addEventListener('input', inputSearchHandler)
searchCheckbox.addEventListener('change', (e) => {
  isSearchTriggerEnabled = e.target.checked
})

updatePaginationInfo()
