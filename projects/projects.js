
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

// Update the projects title with the number of projects
const projectsTitle = document.querySelector('.projects-title');

projectsTitle.textContent = `Projects (${projects.length})`;

// Drawing circle path with D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
);

let data = rolledData.map(([year, count]) => {
    return {
        value: count,
        label: year
    };
});

let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

let sliceGenerator = d3.pie().value((d) => d.value);

let arcData = sliceGenerator(data);

let arcs = arcData.map((d) => arcGenerator(d));

let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcs.forEach((arc, idx) => {
    d3.select('svg')
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(idx));
});

// add legend to the page
let legend = d3.select('.legend');

data.forEach((d, idx) => {
    legend
        .append('li')
        .attr('style', `--color:${colors(idx)}`)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});

// add event listener to the search bar to filter the projects
let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
    query = event.target.value;

    let filteredProjects = projects.filter((project) =>
        project.title.includes(query)
    );

    renderProjects(filteredProjects, projectsContainer, 'h2');
});

