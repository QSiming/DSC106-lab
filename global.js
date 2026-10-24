//global.js
console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}



//create an array of pages with their urls and titles
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'CV/', title: 'CV' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/QSiming', title: 'GitHub' }
];

//create a new nav element and prepend it to the body
let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
        ? "/"
        : "/DSC106-lab/";

//loop through the pages array and create a link for each page
for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }

    let a = document.createElement('a');

    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    if (a.host !== location.host) {
        a.target = "_blank";
    }

    nav.append(a);
}


//Adding HTML for the dark mode switch
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

//make the dark mode switch actually work
let select = document.querySelector('.color-scheme select');

select.addEventListener('input', function (event) {
  document.documentElement.style.setProperty(
    'color-scheme',
    event.target.value
  );

 //store the selected color scheme in localStorage, so that it persists across page reloads 
  localStorage.colorScheme = event.target.value;
});

if ('colorScheme' in localStorage) {
  document.documentElement.style.setProperty(
    'color-scheme',
    localStorage.colorScheme
  );

  select.value = localStorage.colorScheme;
};


let form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
    event.preventDefault();

    let data = new FormData(form);

    let url = form.action + "?";

    for (let [name, value] of data) {
        url += `${name}=${encodeURIComponent(value)}&`;
    }

    location.href = url;
});

//fetch JSON data from a url and return it as an object
export async function fetchJSON(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}
//render projects to the page
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';

    for (let project of projects) {
        const article = document.createElement('article');

        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
            <p>${project.year}</p>
        `;

        containerElement.appendChild(article);
    }
}
//fetch GitHub data for a given username
export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}