
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

// Update the projects title with the number of projects
const projectsTitle = document.querySelector('.projects-title');

projectsTitle.textContent = `Projects (${projects.length})`;

// Drawing circle path with D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedIndex = -1;

function renderPieChart(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let newData = newRolledData.map(([year, count]) => {
        return {
            value: count,
            label: year
        };
    });

    let newSliceGenerator = d3.pie().value((d) => d.value);

    let newArcData = newSliceGenerator(newData);

    let newArcs = newArcData.map((d) => arcGenerator(d));

    let newSVG = d3.select('svg');

    // clear old pie chart
    newSVG.selectAll('path').remove();

    // clear old legend
    d3.select('.legend').selectAll('li').remove();

    let legend = d3.select('.legend');

    // draw updated pie chart
    newArcs.forEach((arc, i) => {
    newSVG
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .on('click', () => {
            selectedIndex = selectedIndex === i ? -1 : i;

            newSVG
                .selectAll('path')
                .attr('class', (_, idx) =>
                    idx === selectedIndex ? 'selected' : ''
                );

            legend
                .selectAll('li')
                .attr('class', (_, idx) =>
                    idx === selectedIndex ? 'selected' : ''
                );

            // filter the projects based on the selected year
            if (selectedIndex === -1) {
                renderProjects(projects, projectsContainer, 'h2');
            } else {
                let selectedYear = newData[selectedIndex].label;

                let filteredProjects = projects.filter(
                    (project) => project.year === selectedYear
                );

                renderProjects(filteredProjects, projectsContainer, 'h2');
            }
        });
});

    // draw updated legend
    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .html(
                `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
            );
    });
}

renderPieChart(projects);

// add event listener to the search bar to filter the projects
let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('change', (event) => {
    query = event.target.value.toLowerCase();

    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');

    renderPieChart(filteredProjects);
});

