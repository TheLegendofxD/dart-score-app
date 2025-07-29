/*const darkModeToggle = document.getElementById('darkModeToggle');*/
const htmlElement = document.documentElement // Or document.body;

// Function to apply the theme
function applyTheme(theme) {
  if (theme === 'dark') {
    htmlElement.setAttribute('data-bs-theme', 'dark')
  } else {
    htmlElement.removeAttribute('data-bs-theme')
  }
}

/*
darkModeToggle.addEventListener('click', () => {
  let currentTheme = htmlElement.getAttribute('data-bs-theme')
  let newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  applyTheme(newTheme)
  localStorage.setItem('theme', newTheme) // Store preference
});*/

// Check for stored theme preference, or system preference on page load
document.addEventListener('DOMContentLoaded', () => {
  const storedTheme = localStorage.getItem('theme')

  if (storedTheme) {
    applyTheme(storedTheme)
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark') // Apply dark mode based on system preference
  }
})
